const { eq } = require("drizzle-orm");

class djRepository {
    /**
     * @param {Object} context
     * @param {"sql"|"mongodb"} context.type
     * @param {any} [context.db]
     * @param {any} [context.table]
     * @param {any} [context.model]
     * @param {any} [context.guildRepository]
     */
    constructor(context) {
        this.type = context.type;
        this.db = context.db;
        this.table = context.table;
        this.model = context.model;
        this.guildRepository = context.guildRepository;
    }

    /**
     * Helper to parse array safely from SQL string or Mongo array
     * @private
     */
    _parseArray(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    _parseRoles(raw) {
        return this._parseArray(raw);
    }

    /**
     * Get DJ configuration (mode, roles, and users) for a guild
     * @param {string} guildId
     * @returns {Promise<{ guildId: string, mode: boolean, roles: string[], users: string[] }>}
     */
    async get(guildId) {
        if (this.type === "mongodb") {
            const result = await this.model.findOne({ guildId }).lean();
            return {
                guildId,
                mode: result ? Boolean(result.mode) : false,
                roles: result && Array.isArray(result.roles) ? result.roles : [],
                users: result && Array.isArray(result.users) ? result.users : [],
            };
        }

        // SQL (PostgreSQL, SQLite, MySQL, PGlite)
        const rows = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (rows.length === 0) {
            return {
                guildId,
                mode: false,
                roles: [],
                users: [],
            };
        }

        return {
            guildId,
            mode: Boolean(rows[0].mode),
            roles: this._parseArray(rows[0].roles),
            users: this._parseArray(rows[0].users),
        };
    }

    /**
     * Set DJ mode for a guild
     * @param {string} guildId
     * @param {boolean} mode
     */
    async setMode(guildId, mode) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        const boolMode = Boolean(mode);

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { mode: boolMode } },
                { upsert: true, returnDocument: "after" }
            );
            return;
        }

        // SQL
        const intMode = boolMode ? 1 : 0;
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ mode: intMode })
                .where(eq(this.table.guildId, guildId));
        } else {
            await this.db.insert(this.table).values({
                guildId,
                mode: intMode,
                roles: "[]",
                users: "[]",
            });
        }
    }

    /**
     * Toggle DJ mode for a guild
     * @param {string} guildId
     * @returns {Promise<boolean>}
     */
    async toggle(guildId) {
        const current = await this.get(guildId);
        const newMode = !current.mode;
        await this.setMode(guildId, newMode);
        return newMode;
    }

    /**
     * Add a DJ role to a guild (and automatically enables DJ mode)
     * @param {string} guildId
     * @param {string} roleId
     * @returns {Promise<boolean>} Whether the role was newly added
     */
    async addRole(guildId, roleId) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        if (this.type === "mongodb") {
            const current = await this.get(guildId);
            if (current.roles.includes(roleId)) return false;

            await this.model.findOneAndUpdate(
                { guildId },
                {
                    $addToSet: { roles: roleId },
                    $set: { mode: true },
                },
                { upsert: true, returnDocument: "after" }
            );
            return true;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            const roles = this._parseArray(existing[0].roles);
            if (roles.includes(roleId)) return false;
            roles.push(roleId);

            await this.db
                .update(this.table)
                .set({ mode: 1, roles: JSON.stringify(roles) })
                .where(eq(this.table.guildId, guildId));
            return true;
        } else {
            await this.db.insert(this.table).values({
                guildId,
                mode: 1,
                roles: JSON.stringify([roleId]),
                users: "[]",
            });
            return true;
        }
    }

    /**
     * Remove a DJ role from a guild
     * @param {string} guildId
     * @param {string} roleId
     * @returns {Promise<boolean>} Whether the role was removed
     */
    async removeRole(guildId, roleId) {
        const current = await this.get(guildId);
        if (!current.roles.includes(roleId)) return false;

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $pull: { roles: roleId } },
                { upsert: true, returnDocument: "after" }
            );
            return true;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            const roles = this._parseArray(existing[0].roles).filter((r) => r !== roleId);
            await this.db
                .update(this.table)
                .set({ roles: JSON.stringify(roles) })
                .where(eq(this.table.guildId, guildId));
            return true;
        }
        return false;
    }

    /**
     * Clear all DJ roles from a guild
     * @param {string} guildId
     */
    async clearRoles(guildId) {
        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { roles: [] } },
                { upsert: true, returnDocument: "after" }
            );
            return;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ roles: "[]" })
                .where(eq(this.table.guildId, guildId));
        }
    }

    /**
     * Get all DJ role IDs for a guild
     * @param {string} guildId
     * @returns {Promise<string[]>}
     */
    async getRoles(guildId) {
        const dj = await this.get(guildId);
        return dj.roles;
    }

    /**
     * Add a DJ user to a guild (and automatically enables DJ mode)
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<boolean>} Whether the user was newly added
     */
    async addUser(guildId, userId) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        if (this.type === "mongodb") {
            const current = await this.get(guildId);
            if (current.users.includes(userId)) return false;

            await this.model.findOneAndUpdate(
                { guildId },
                {
                    $addToSet: { users: userId },
                    $set: { mode: true },
                },
                { upsert: true, returnDocument: "after" }
            );
            return true;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            const users = this._parseArray(existing[0].users);
            if (users.includes(userId)) return false;
            users.push(userId);

            await this.db
                .update(this.table)
                .set({ mode: 1, users: JSON.stringify(users) })
                .where(eq(this.table.guildId, guildId));
            return true;
        } else {
            await this.db.insert(this.table).values({
                guildId,
                mode: 1,
                roles: "[]",
                users: JSON.stringify([userId]),
            });
            return true;
        }
    }

    /**
     * Remove a DJ user from a guild
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<boolean>} Whether the user was removed
     */
    async removeUser(guildId, userId) {
        const current = await this.get(guildId);
        if (!current.users.includes(userId)) return false;

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $pull: { users: userId } },
                { upsert: true, returnDocument: "after" }
            );
            return true;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            const users = this._parseArray(existing[0].users).filter((u) => u !== userId);
            await this.db
                .update(this.table)
                .set({ users: JSON.stringify(users) })
                .where(eq(this.table.guildId, guildId));
            return true;
        }
        return false;
    }

    /**
     * Clear all DJ users from a guild
     * @param {string} guildId
     */
    async clearUsers(guildId) {
        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { users: [] } },
                { upsert: true, returnDocument: "after" }
            );
            return;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ users: "[]" })
                .where(eq(this.table.guildId, guildId));
        }
    }

    /**
     * Get all DJ user IDs for a guild
     * @param {string} guildId
     * @returns {Promise<string[]>}
     */
    async getUsers(guildId) {
        const dj = await this.get(guildId);
        return dj.users;
    }

    /**
     * Clear all DJ settings (roles and users) and disable DJ mode
     * @param {string} guildId
     */
    async clearAll(guildId) {
        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { mode: false, roles: [], users: [] } },
                { upsert: true, returnDocument: "after" }
            );
            return;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ mode: 0, roles: "[]", users: "[]" })
                .where(eq(this.table.guildId, guildId));
        }
    }
}

module.exports = djRepository;
