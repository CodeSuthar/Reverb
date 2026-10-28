const {
    eq
} = require("drizzle-orm");

class stayRepository {
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
     * Helper to format stay records consistently
     * @private
     */
    _formatStay(record) {
        if (!record) return null;
        const textChannelId = record.textChannelId || record.textId;
        const voiceChannelId = record.voiceChannelId || record.voiceId;
        return {
            guildId: record.guildId,
            textChannelId,
            voiceChannelId,
            textId: textChannelId,
            voiceId: voiceChannelId,
        };
    }

    /**
     * Get 24/7 stay configuration for a guild
     * @param {string} guildId
     * @returns {Promise<{ guildId: string, textChannelId: string, voiceChannelId: string, textId: string, voiceId: string } | null>}
     */
    async get(guildId) {
        if (this.type === "mongodb") {
            const result = await this.model.findOne({ guildId }).lean();
            return this._formatStay(result);
        }

        // SQL
        const rows = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (rows.length === 0) return null;
        return this._formatStay(rows[0]);
    }

    /**
     * Get all active 24/7 stay configurations (used on bot startup)
     * @returns {Promise<Array<{ guildId: string, textChannelId: string, voiceChannelId: string, textId: string, voiceId: string }>>}
     */
    async getAll() {
        if (this.type === "mongodb") {
            const rows = await this.model.find({}).lean();
            return rows.map((r) => this._formatStay(r));
        }

        // SQL
        const rows = await this.db.select().from(this.table);
        return rows.map((r) => this._formatStay(r));
    }

    /**
     * Set 24/7 stay configuration
     * @param {string} guildId
     * @param {string} textChannelId
     * @param {string} voiceChannelId
     */
    async set(guildId, textChannelId, voiceChannelId) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                { $set: { textChannelId, voiceChannelId } },
                { upsert: true }
            );
            return;
        }

        // SQL
        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set({ textChannelId, voiceChannelId })
                .where(eq(this.table.guildId, guildId));
        } else {
            await this.db.insert(this.table).values({ guildId, textChannelId, voiceChannelId });
        }
    }

    /**
     * Delete 24/7 stay configuration
     * @param {string} guildId
     */
    async delete(guildId) {
        if (this.type === "mongodb") {
            await this.model.deleteOne({ guildId });
            return;
        }

        // SQL
        await this.db.delete(this.table).where(eq(this.table.guildId, guildId));
    }
}

module.exports = stayRepository;
