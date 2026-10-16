const { Innertube } = require("youtubei.js");

class youtubeMusic {
    constructor(lavalinkManager) {
        this.lavalinkManager = lavalinkManager;
        this.youtube = null;
        this.initializing = null;

        this.searchCache = new Map();
        this.pendingSearches = new Map();

        this.cacheTtlMs = 5 * 60 * 1000;
        this.maxCacheSize = 200;
        this.maxSongsPerQuery = 10;
    }

    async init() {
        if (this.youtube) return this.youtube;

        if (!this.initializing) {
            this.initializing = Innertube.create({
                lang: "en",
                location: "IN",
                // We only search metadata, so skip downloading the player
                // script and build the session locally. Both cut startup time.
                retrieve_player: false,
                generate_session_locally: true,
            })
                .then((youtube) => {
                    this.youtube = youtube;
                    return youtube;
                })
                .catch((error) => {
                    this.initializing = null;
                    throw error;
                });
        }

        return this.initializing;
    }

    /**
     * Start the session in the background so the first search is not slow.
     */
    warmup() {
        return this.init().catch((error) => {
            console.error("[YTM] Warmup failed:", error);
        });
    }

    getText(value) {
        if (!value) return null;

        if (typeof value === "string") {
            return value;
        }

        return value.text ?? null;
    }

    getThumbnail(thumbnails = []) {
        if (!thumbnails.length) return null;

        const thumbnail = thumbnails[thumbnails.length - 1];

        return {
            url: thumbnail.url,
            width: thumbnail.width ?? null,
            height: thumbnail.height ?? null,
        };
    }

    getSongDetails(item) {
        const artists = (item.artists ?? []).map((artist) => ({
            name: this.getText(artist.name),
            id: artist.id ?? null,
            url: artist.id
                ? `https://music.youtube.com/channel/${artist.id}`
                : null,
        }));

        const album = item.album
            ? {
                name: this.getText(item.album.name),
                id: item.album.id ?? null,
                url: item.album.id
                    ? `https://music.youtube.com/playlist?list=${item.album.id}`
                    : null,
            }
            : null;

        const durationSeconds = Number(item.duration?.seconds ?? 0);

        return {
            identifier: item.id ?? null,
            title: this.getText(item.title),
            artist: artists
                .map((artist) => artist.name)
                .filter(Boolean)
                .join(", "),
            artists,
            album,
            duration: {
                text: this.getText(item.duration),
                seconds: durationSeconds,
                milliseconds: durationSeconds * 1000,
            },
            thumbnails: (item.thumbnails ?? []).map((thumbnail) => ({
                url: thumbnail.url,
                width: thumbnail.width ?? null,
                height: thumbnail.height ?? null,
            })),
            thumbnail: this.getThumbnail(item.thumbnails),
            uri: item.id
                ? `https://music.youtube.com/watch?v=${item.id}`
                : null,
            source: "youtube_music",
            isMusicResult: true,
        };
    }

    /**
     * Fetch (and cache) the song list for a query.
     */
    async _fetchSongs(cacheKey, query) {
        const youtube = await this.init();

        const result = await youtube.music.search(query, {
            type: "song",
        });

        const songs = (result.songs?.contents ?? [])
            .map((item) => this.getSongDetails(item))
            .filter((song) => song.identifier && song.title)
            .slice(0, this.maxSongsPerQuery);

        if (songs.length) {
            this.searchCache.set(cacheKey, {
                songs,
                expiresAt: Date.now() + this.cacheTtlMs,
            });

            while (this.searchCache.size > this.maxCacheSize) {
                this.searchCache.delete(
                    this.searchCache.keys().next().value,
                );
            }
        }

        return songs;
    }

    async searchSongs(query, limit = 10) {
        if (typeof query !== "string" || !query.trim()) {
            throw new TypeError(
                "Search query must be a non-empty string.",
            );
        }

        const cacheKey = query.trim().toLowerCase();

        const cached = this.searchCache.get(cacheKey);

        if (cached) {
            if (cached.expiresAt > Date.now()) {
                return cached.songs.slice(0, limit);
            }

            this.searchCache.delete(cacheKey);
        }

        let pending = this.pendingSearches.get(cacheKey);

        if (!pending) {
            pending = this._fetchSongs(cacheKey, query.trim()).finally(
                () => this.pendingSearches.delete(cacheKey),
            );

            this.pendingSearches.set(cacheKey, pending);
        }

        const songs = await pending;

        return songs.slice(0, limit);
    }
}

module.exports = youtubeMusic;