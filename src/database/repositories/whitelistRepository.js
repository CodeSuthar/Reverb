const {
    eq
} = require("drizzle-orm");

class whitelistRepository {
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

    /**
     * Get whitelist configuration for a guild
     * @param {string} guildId
     * @returns {Promise<{ guildId: string, mode: boolean, channels: string[], roles: string[], users: string[] }>}
     */
    async get(guildId) {
        if (this.type === "mongodb") {
            const result = await this.model.findOne({ guildId }).lean();
            return {
                guildId,
                mode: result ? Boolean(result.mode) : false,
                channels: result && Array.isArray(result.channels) ? result.channels : [],
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
                channels: [],
                roles: [],
                users: [],
            };
        }

        return {
            guildId,
            mode: Boolean(rows[0].mode),
            channels: this._parseArray(rows[0].channels),
            roles: this._parseArray(rows[0].roles),
            users: this._parseArray(rows[0].users),
        };
    }

    /**
     * Set whitelist mode for a guild
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
                channels: "[]",
                roles: "[]",
                users: "[]",
            });
        }
    }

    /**
     * Toggle whitelist mode for a guild
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
     * Add a channel to the whitelist
     * @param {string} guildId
     * @param {string} channelId
     * @returns {Promise<boolean>}
     */
    async addChannel(guildId, channelId) {
        const current = await this.get(guildId);
        if (current.channels.includes(channelId)) return false;
        const updated = [...current.channels, channelId];
        await this._updateField(guildId, "channels", updated);
        return true;
    }

    /**
     * Remove a channel from the whitelist
     * @param {string} guildId
     * @param {string} channelId
     * @returns {Promise<boolean>}
     */
    async removeChannel(guildId, channelId) {
        const current = await this.get(guildId);
        if (!current.channels.includes(channelId)) return false;
        const updated = current.channels.filter((id) => id !== channelId);
        await this._updateField(guildId, "channels", updated);
        return true;
    }

    /**
     * Clear all allowed channels
     * @param {string} guildId
     */
    async clearChannels(guildId) {
        await this._updateField(guildId, "channels", []);
    }

    /**
     * Add a bypass role
     * @param {string} guildId
     * @param {string} roleId
     * @returns {Promise<boolean>}
     */
    async addRole(guildId, roleId) {
        const current = await this.get(guildId);
        if (current.roles.includes(roleId)) return false;
        const updated = [...current.roles, roleId];
        await this._updateField(guildId, "roles", updated);
        return true;
    }

    /**
     * Remove a bypass role
     * @param {string} guildId
     * @param {string} roleId
     * @returns {Promise<boolean>}
     */
    async removeRole(guildId, roleId) {
        const current = await this.get(guildId);
        if (!current.roles.includes(roleId)) return false;
        const updated = current.roles.filter((id) => id !== roleId);
        await this._updateField(guildId, "roles", updated);
        return true;
    }

    /**
     * Clear all bypass roles
     * @param {string} guildId
     */
    async clearRoles(guildId) {
        await this._updateField(guildId, "roles", []);
    }

    /**
     * Add a bypass user
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async addUser(guildId, userId) {
        const current = await this.get(guildId);
        if (current.users.includes(userId)) return false;
        const updated = [...current.users, userId];
        await this._updateField(guildId, "users", updated);
        return true;
    }

    /**
     * Remove a bypass user
     * @param {string} guildId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async removeUser(guildId, userId) {
        const current = await this.get(guildId);
        if (!current.users.includes(userId)) return false;
        const updated = current.users.filter((id) => id !== userId);
        await this._updateField(guildId, "users", updated);
        return true;
    }

    /**
     * Clear all bypass users
     * @param {string} guildId
     */
    async clearUsers(guildId) {
        await this._updateField(guildId, "users", []);
    }

    /**
     * Reset everything for a guild
     * @param {string} guildId
     */
    async clearAll(guildId) {
        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { mode: false, channels: [], roles: [], users: [] } },
                { upsert: true }
            );
            return;
        }

        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ mode: 0, channels: "[]", roles: "[]", users: "[]" })
                .where(eq(this.table.guildId, guildId));
        } else {
            await this.db.insert(this.table).values({
                guildId,
                mode: 0,
                channels: "[]",
                roles: "[]",
                users: "[]",
            });
        }
    }

    /**
     * @private
     */
    async _updateField(guildId, field, arrayValue) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { [field]: arrayValue } },
                { upsert: true }
            );
            return;
        }

        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ [field]: JSON.stringify(arrayValue) })
                .where(eq(this.table.guildId, guildId));
        } else {
            await this.db.insert(this.table).values({
                guildId,
                mode: 0,
                channels: field === "channels" ? JSON.stringify(arrayValue) : "[]",
                roles: field === "roles" ? JSON.stringify(arrayValue) : "[]",
                users: field === "users" ? JSON.stringify(arrayValue) : "[]",
            });
        }
    }
}

module.exports = whitelistRepository;
