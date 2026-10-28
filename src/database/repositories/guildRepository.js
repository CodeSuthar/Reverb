const {
    eq
} = require("drizzle-orm");
const config = require("../../../config.reverb.js");

class guildRepository {
    /**
     * @param {Object} context
     * @param {"sql"|"mongodb"} context.type
     * @param {any} [context.db] Drizzle instance
     * @param {any} [context.table] Drizzle table
     * @param {any} [context.model] Mongoose model
     * @param {string} [context.defaultPrefix="r!"]
     * @param {string} [context.defaultLanguage="EnglishUS"]
     * @param {number} [context.defaultVolume=100]
     */
    constructor(context) {
        this.type = context.type;
        this.db = context.db;
        this.table = context.table;
        this.model = context.model;
        this.defaultPrefix = context.defaultPrefix || config.bot?.prefix || "r!";
        this.defaultLanguage = context.defaultLanguage || "EnglishUS";
        this.defaultVolume = context.defaultVolume ?? config.music?.defaultVolume ?? 100;
    }

    /**
     * Get or create guild configuration
     * @param {string} guildId
     * @returns {Promise<{ guildId: string, prefix: string, language: string, defaultVolume: number }>}
     */
    async get(guildId) {
        if (this.type === "mongodb") {
            let guild = await this.model.findOne({ guildId }).lean();
            if (guild) {
                return {
                    guildId: guild.guildId,
                    prefix: guild.prefix || this.defaultPrefix,
                    language: guild.language || this.defaultLanguage,
                    defaultVolume: guild.defaultVolume ?? this.defaultVolume,
                };
            }

            guild = await this.model.findOneAndUpdate(
                { guildId },
                {
                    $setOnInsert: {
                        guildId,
                        prefix: this.defaultPrefix,
                        language: this.defaultLanguage,
                        defaultVolume: this.defaultVolume,
                    },
                },
                { upsert: true, returnDocument: "after" }
            ).lean();

            return {
                guildId: guild.guildId,
                prefix: guild.prefix,
                language: guild.language,
                defaultVolume: guild.defaultVolume,
            };
        }

        // SQL (Postgres, SQLite, MySQL, PGlite)
        const rows = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (rows.length > 0) {
            return {
                guildId: rows[0].guildId,
                prefix: rows[0].prefix || this.defaultPrefix,
                language: rows[0].language || this.defaultLanguage,
                defaultVolume: rows[0].defaultVolume ?? this.defaultVolume,
            };
        }

        try {
            await this.db.insert(this.table).values({
                guildId,
                prefix: this.defaultPrefix,
                language: this.defaultLanguage,
                defaultVolume: this.defaultVolume,
            });
        } catch {
            // Concurrent insert caught; record exists
        }

        const created = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        return {
            guildId,
            prefix: created[0]?.prefix || this.defaultPrefix,
            language: created[0]?.language || this.defaultLanguage,
            defaultVolume: created[0]?.defaultVolume ?? this.defaultVolume,
        };
    }

    /**
     * Set guild prefix
     * @param {string} guildId
     * @param {string} prefix
     */
    async setPrefix(guildId, prefix) {
        if (this.type === "mongodb") {
            await this.get(guildId);
            await this.model.updateOne({ guildId }, { $set: { prefix } });
            return;
        }

        // SQL
        await this.get(guildId);
        await this.db
            .update(this.table)
            .set({ prefix })
            .where(eq(this.table.guildId, guildId));
    }

    /**
     * Get guild prefix
     * @param {string} guildId
     * @returns {Promise<string>}
     */
    async getPrefix(guildId) {
        const guild = await this.get(guildId);
        return guild?.prefix || this.defaultPrefix;
    }

    /**
     * Update guild language
     * @param {string} guildId
     * @param {string} language
     */
    async updateLanguage(guildId, language) {
        if (this.type === "mongodb") {
            await this.get(guildId);
            await this.model.updateOne({ guildId }, { $set: { language } });
            return;
        }

        // SQL
        await this.get(guildId);
        await this.db
            .update(this.table)
            .set({ language })
            .where(eq(this.table.guildId, guildId));
    }

    /**
     * Get guild language
     * @param {string} guildId
     * @returns {Promise<string>}
     */
    async getLanguage(guildId) {
        const guild = await this.get(guildId);
        return guild?.language || this.defaultLanguage;
    }

    /**
     * Set default volume
     * @param {string} guildId
     * @param {number} volume
     */
    async setDefaultVolume(guildId, volume) {
        if (this.type === "mongodb") {
            await this.get(guildId);
            await this.model.updateOne({ guildId }, { $set: { defaultVolume: volume } });
            return;
        }

        // SQL
        await this.get(guildId);
        await this.db
            .update(this.table)
            .set({ defaultVolume: volume })
            .where(eq(this.table.guildId, guildId));
    }

    /**
     * Get default volume
     * @param {string} guildId
     * @returns {Promise<number>}
     */
    async getDefaultVolume(guildId) {
        const guild = await this.get(guildId);
        return guild?.defaultVolume ?? this.defaultVolume;
    }

    /**
     * Delete guild configuration
     * @param {string} guildId
     * @returns {Promise<boolean>}
     */
    async delete(guildId) {
        if (this.type === "mongodb") {
            const res = await this.model.deleteOne({ guildId });
            return res.deletedCount > 0;
        }

        // SQL
        await this.db.delete(this.table).where(eq(this.table.guildId, guildId));
        return true;
    }
}

module.exports = guildRepository;
