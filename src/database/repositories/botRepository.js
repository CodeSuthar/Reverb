const { eq, sql } = require("drizzle-orm");

class botRepository {
    /**
     * @param {Object} context
     * @param {"sql"|"mongodb"} context.type
     * @param {any} [context.db] Drizzle instance
     * @param {any} [context.table] Drizzle table
     * @param {any} [context.model] Mongoose model
     */
    constructor(context) {
        this.type = context.type;
        this.db = context.db;
        this.table = context.table;
        this.model = context.model;
    }

    /**
     * Get or create bot statistics
     * @param {string} botId
     * @returns {Promise<{ botId: string, totalPlaySong: number }>}
     */
    async get(botId) {
        if (this.type === "mongodb") {
            const result = await this.model.findOneAndUpdate(
                { botId },
                { $setOnInsert: { botId, totalPlaySong: 0 } },
                { upsert: true, returnDocument: "after" }
            ).lean();
            return {
                botId: result.botId,
                totalPlaySong: result.totalPlaySong ?? 0,
            };
        }

        // SQL
        const rows = await this.db.select().from(this.table).where(eq(this.table.botId, botId));
        if (rows.length > 0) {
            return {
                botId: rows[0].botId,
                totalPlaySong: rows[0].totalPlaySong ?? 0,
            };
        }

        await this.db.insert(this.table).values({ botId, totalPlaySong: 0 }).onConflictDoNothing();
        const created = await this.db.select().from(this.table).where(eq(this.table.botId, botId));
        return {
            botId,
            totalPlaySong: created[0]?.totalPlaySong ?? 0,
        };
    }

    /**
     * Atomically increment songs played
     * @param {string} botId
     * @param {number} [count=1]
     * @returns {Promise<number>}
     */
    async incrementSongsPlayed(botId, count = 1) {
        if (this.type === "mongodb") {
            const result = await this.model.findOneAndUpdate(
                { botId },
                { $inc: { totalPlaySong: count } },
                { upsert: true, returnDocument: "after" }
            ).lean();
            return result.totalPlaySong;
        }

        // SQL
        await this.get(botId);
        await this.db
            .update(this.table)
            .set({ totalPlaySong: sql`${this.table.totalPlaySong} + ${count}` })
            .where(eq(this.table.botId, botId));

        const updated = await this.db.select().from(this.table).where(eq(this.table.botId, botId));
        return updated[0]?.totalPlaySong ?? 0;
    }
}

module.exports = botRepository;
