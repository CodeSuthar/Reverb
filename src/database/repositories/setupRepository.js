const {
    eq
} = require("drizzle-orm");

class setupRepository {
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
     * Format setup record consistently
     * @private
     */
    _formatSetup(record) {
        if (!record) return null;
        const textChannelId = record.textChannelId || record.textId;
        const voiceChannelId = record.voiceChannelId || null;
        const parentChannelId = record.parentChannelId || null;
        const messageId = record.messageId;

        return {
            guildId: record.guildId,
            parentChannelId,
            textChannelId,
            voiceChannelId,
            messageId,
            textId: textChannelId,
        };
    }

    /**
     * Get setup channel & message configuration for a guild
     * @param {string} guildId
     * @returns {Promise<{ guildId: string, parentChannelId: string|null, textChannelId: string, voiceChannelId: string|null, messageId: string, textId: string } | null>}
     */
    async get(guildId) {
        if (this.type === "mongodb") {
            const result = await this.model.findOne({ guildId }).lean();
            return this._formatSetup(result);
        }

        // SQL
        const rows = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (rows.length === 0) return null;
        return this._formatSetup(rows[0]);
    }

    /**
     * Get all setup configurations across all guilds
     * @returns {Promise<Array<{ guildId: string, parentChannelId: string|null, textChannelId: string, voiceChannelId: string|null, messageId: string, textId: string }>>}
     */
    async getAll() {
        if (this.type === "mongodb") {
            const rows = await this.model.find({}).lean();
            return rows.map((r) => this._formatSetup(r));
        }

        // SQL
        const rows = await this.db.select().from(this.table);
        return rows.map((r) => this._formatSetup(r));
    }

    /**
     * Set setup channel & message configuration
     * @param {string} guildId
     * @param {string|{ parentChannelId?: string, textChannelId?: string, textId?: string, voiceChannelId?: string, messageId: string }} dataOrTextChannelId
     * @param {string} [messageId]
     * @param {string} [parentChannelId]
     * @param {string} [voiceChannelId]
     */
    async set(guildId, dataOrTextChannelId, messageId, parentChannelId, voiceChannelId) {
        if (this.guildRepository) {
            await this.guildRepository.get(guildId);
        }

        let parentChan = null;
        let textChan = null;
        let voiceChan = null;
        let msgId = null;

        if (typeof dataOrTextChannelId === "object" && dataOrTextChannelId !== null) {
            parentChan = dataOrTextChannelId.parentChannelId || null;
            textChan = dataOrTextChannelId.textChannelId || dataOrTextChannelId.textId;
            voiceChan = dataOrTextChannelId.voiceChannelId || null;
            msgId = dataOrTextChannelId.messageId;
        } else {
            textChan = dataOrTextChannelId;
            msgId = messageId;
            parentChan = parentChannelId || null;
            voiceChan = voiceChannelId || null;
        }

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { guildId },
                {
                    $set: {
                        parentChannelId: parentChan,
                        textChannelId: textChan,
                        voiceChannelId: voiceChan,
                        messageId: msgId,
                    },
                },
                { upsert: true, returnDocument: "after" }
            );
            return;
        }

        // SQL
        const payload = {
            parentChannelId: parentChan,
            textChannelId: textChan,
            voiceChannelId: voiceChan,
            messageId: msgId,
        };

        const existing = await this.db.select().from(this.table).where(eq(this.table.guildId, guildId));
        if (existing.length > 0) {
            await this.db
                .update(this.table)
                .set(payload)
                .where(eq(this.table.guildId, guildId));
        } else {
            await this.db.insert(this.table).values({ guildId, ...payload });
        }
    }

    /**
     * Delete setup configuration
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

module.exports = setupRepository;
