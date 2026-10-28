const {
    and, eq
} = require("drizzle-orm");
const {
    randomUUID
} = require("crypto");

class playlistRepository {
    /**
     * @param {Object} context
     * @param {"sql"|"mongodb"} context.type
     * @param {any} [context.db]
     * @param {any} [context.table]
     * @param {any} [context.model]
     */
    constructor(context) {
        this.type = context.type;
        this.db = context.db;
        this.table = context.table;
        this.model = context.model;
    }

    /**
     * Get a user playlist by name
     * @param {string} userId
     * @param {string} name
     * @returns {Promise<{ id: string, userId: string, name: string, tracks: string[], isPrivate: boolean } | null>}
     */
    async get(userId, name) {
        if (this.type === "mongodb") {
            const result = await this.model.findOne({ userId, name }).lean();
            if (!result) return null;
            return {
                id: result.id,
                userId: result.userId,
                name: result.name,
                tracks: Array.isArray(result.tracks) ? result.tracks : [],
                isPrivate: Boolean(result.isPrivate),
            };
        }

        // SQL
        const rows = await this.db
            .select()
            .from(this.table)
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));

        if (rows.length === 0) return null;
        let tracks = [];
        try {
            tracks = rows[0].tracks ? JSON.parse(rows[0].tracks) : [];
        } catch {
            tracks = [];
        }
        return {
            id: rows[0].id,
            userId: rows[0].userId,
            name: rows[0].name,
            tracks,
            isPrivate: Boolean(rows[0].isPrivate),
        };
    }

    /**
     * Get all playlists for a user
     * @param {string} userId
     * @returns {Promise<Array<{ id: string, userId: string, name: string, tracks: string[], isPrivate: boolean }>>}
     */
    async getUserPlaylists(userId) {
        if (this.type === "mongodb") {
            const rows = await this.model.find({ userId }).lean();
            return rows.map((r) => ({
                id: r.id,
                userId: r.userId,
                name: r.name,
                tracks: Array.isArray(r.tracks) ? r.tracks : [],
                isPrivate: Boolean(r.isPrivate),
            }));
        }

        // SQL
        const rows = await this.db.select().from(this.table).where(eq(this.table.userId, userId));
        return rows.map((r) => {
            let tracks = [];
            try {
                tracks = r.tracks ? JSON.parse(r.tracks) : [];
            } catch {
                tracks = [];
            }
            return {
                id: r.id,
                userId: r.userId,
                name: r.name,
                tracks,
                isPrivate: Boolean(r.isPrivate),
            };
        });
    }

    /**
     * Create an empty playlist
     * @param {string} userId
     * @param {string} name
     * @param {boolean} [isPrivate=false]
     */
    async create(userId, name, isPrivate = false) {
        return this.createWithTracks(userId, name, [], isPrivate);
    }

    /**
     * Create a playlist with initial tracks
     * @param {string} userId
     * @param {string} name
     * @param {string[]} tracks
     * @param {boolean} [isPrivate=false]
     */
    async createWithTracks(userId, name, tracks = [], isPrivate = false) {
        const id = randomUUID();
        const cleanTracks = Array.isArray(tracks) ? tracks : [];

        if (this.type === "mongodb") {
            await this.model.findOneAndUpdate(
                { userId, name },
                { $setOnInsert: { id, userId, name, tracks: cleanTracks, isPrivate: Boolean(isPrivate) } },
                { upsert: true }
            );
            return;
        }

        // SQL
        const existing = await this.db
            .select()
            .from(this.table)
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));

        if (existing.length === 0) {
            try {
                await this.db.insert(this.table).values({
                    id,
                    userId,
                    name,
                    tracks: JSON.stringify(cleanTracks),
                    isPrivate: isPrivate ? 1 : 0,
                });
            } catch {
                // Ignore duplicate
            }
        }
    }

    /**
     * Set a playlist's privacy (public or private)
     * @param {string} userId
     * @param {string} name
     * @param {boolean} isPrivate
     */
    async setPrivacy(userId, name, isPrivate) {
        if (this.type === "mongodb") {
            await this.model.updateOne({ userId, name }, { $set: { isPrivate: Boolean(isPrivate) } });
            return;
        }

        // SQL
        await this.db
            .update(this.table)
            .set({ isPrivate: isPrivate ? 1 : 0 })
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
    }

    /**
     * Delete a playlist
     * @param {string} userId
     * @param {string} name
     */
    async delete(userId, name) {
        if (this.type === "mongodb") {
            await this.model.deleteOne({ userId, name });
            return;
        }

        // SQL
        await this.db
            .delete(this.table)
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
    }

    /**
     * Clear all tracks from a playlist
     * @param {string} userId
     * @param {string} name
     */
    async clearTracks(userId, name) {
        if (this.type === "mongodb") {
            await this.model.updateOne({ userId, name }, { $set: { tracks: [] } });
            return;
        }

        // SQL
        await this.db
            .update(this.table)
            .set({ tracks: JSON.stringify([]) })
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
    }

    /**
     * Add tracks to a playlist
     * @param {string} userId
     * @param {string} name
     * @param {string[]} tracks
     */
    async addTracks(userId, name, tracks = []) {
        const toAdd = Array.isArray(tracks) ? tracks : [tracks];
        if (toAdd.length === 0) return;

        if (this.type === "mongodb") {
            const p = await this.model.findOne({ userId, name });
            if (!p) {
                await this.createWithTracks(userId, name, toAdd);
                return;
            }
            await this.model.updateOne({ userId, name }, { $push: { tracks: { $each: toAdd } } });
            return;
        }

        // SQL
        const rows = await this.db
            .select()
            .from(this.table)
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));

        if (rows.length === 0) {
            await this.createWithTracks(userId, name, toAdd);
            return;
        }

        let existing = [];
        try {
            existing = rows[0].tracks ? JSON.parse(rows[0].tracks) : [];
        } catch {
            existing = [];
        }

        const combined = [...existing, ...toAdd];
        await this.db
            .update(this.table)
            .set({ tracks: JSON.stringify(combined) })
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
    }

    /**
     * Replace all tracks in a playlist (e.g. after resolving/upgrading to v4 format)
     * @param {string} userId
     * @param {string} name
     * @param {any[]} tracks
     */
    async setTracks(userId, name, tracks = []) {
        const cleanTracks = Array.isArray(tracks) ? tracks : [];

        if (this.type === "mongodb") {
            await this.model.updateOne({ userId, name }, { $set: { tracks: cleanTracks } });
            return;
        }

        // SQL
        await this.db
            .update(this.table)
            .set({ tracks: JSON.stringify(cleanTracks) })
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
    }

    /**
     * Remove a track by encoded string, track object, or index
     * @param {string} userId
     * @param {string} name
     * @param {string|object|number} target
     */
    async removeTrack(userId, name, target) {
        if (this.type === "mongodb") {
            const p = await this.model.findOne({ userId, name });
            if (!p || !Array.isArray(p.tracks)) return;
            const idx = p.tracks.findIndex((t, i) => {
                if (typeof target === "number") return i === target;
                if (t === target) return true;
                if (typeof t === "object" && t !== null) {
                    if (typeof target === "string") {
                        return t.encoded === target || t.info?.uri === target || t.info?.identifier === target;
                    }
                    if (typeof target === "object" && target !== null) {
                        return t.encoded === target.encoded || (t.info?.uri && t.info?.uri === target.info?.uri);
                    }
                }
                if (typeof t === "string" && typeof target === "object" && target !== null) {
                    return t === target.encoded;
                }
                return false;
            });
            if (idx !== -1) {
                p.tracks.splice(idx, 1);
                await p.save();
            }
            return;
        }

        // SQL
        const rows = await this.db
            .select()
            .from(this.table)
            .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));

        if (rows.length === 0) return;
        let tracks = [];
        try {
            tracks = rows[0].tracks ? JSON.parse(rows[0].tracks) : [];
        } catch {
            tracks = [];
        }

        const idx = tracks.findIndex((t, i) => {
            if (typeof target === "number") return i === target;
            if (t === target) return true;
            if (typeof t === "object" && t !== null) {
                if (typeof target === "string") {
                    return t.encoded === target || t.info?.uri === target || t.info?.identifier === target;
                }
                if (typeof target === "object" && target !== null) {
                    return t.encoded === target.encoded || (t.info?.uri && t.info?.uri === target.info?.uri);
                }
            }
            if (typeof t === "string" && typeof target === "object" && target !== null) {
                return t === target.encoded;
            }
            return false;
        });

        if (idx !== -1) {
            tracks.splice(idx, 1);
            await this.db
                .update(this.table)
                .set({ tracks: JSON.stringify(tracks) })
                .where(and(eq(this.table.userId, userId), eq(this.table.name, name)));
        }
    }

    /**
     * Get all tracks from a playlist
     * @param {string} userId
     * @param {string} name
     * @returns {Promise<string[] | null>}
     */
    async getTracks(userId, name) {
        const playlist = await this.get(userId, name);
        if (!playlist) return null;
        return playlist.tracks;
    }
}

module.exports = playlistRepository;
