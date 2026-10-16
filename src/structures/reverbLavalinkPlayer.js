const { Player } = require("lavalink-client");

/**
 * A custom player class for Reverb.
 */
class reverbLavalinkPlayer extends Player {
    constructor(...args) {
        super(...args);

        this.client = this.LavalinkManager.client;

        this._resolveChannels().catch((err) => {
            console.error("[PLAYER] Error resolving channels:", err);
        });
    }

    /**
     * Search for tracks using multiple providers.
     * Spotify is used only as a reference.
     *
     * Step 1 is always a normal search, to see whether the query is a
     * playlist (from any source). Then:
     *
     * Playlist (loadType === "playlist"):
     *   Every playlist track is resolved individually through the custom
     *   provider flow, and only the best match is kept for each track.
     *   The result keeps loadType "playlist" and the playlist info.
     *
     * Anything else (song name, single track link):
     *   Custom search, returns up to five of the best playable matches.
     *
     * @param {string} query
     * @param {string} requestUser
     * @returns {Promise<Object>}
     */
    async customReverbSearch(query, requestUser) {
        const trimmedQuery = String(query ?? "").trim();
        const isUrl = /^https?:\/\//i.test(trimmedQuery);

        /*
         * 1. Plain text queries: skip redundant initial search and go straight
         *    to the custom search pipeline (parallel Spotify + primary providers).
         */
        if (!isUrl) {
            return this._searchTextQuery(trimmedQuery, requestUser);
        }

        /*
         * 2. URL queries: initial search to detect whether the query is a
         *    playlist or a single track link.
         */
        const initialResult = await this._safeSearch(
            trimmedQuery,
            requestUser,
            "Initial search",
            15000,
        );

        /*
         * 2a. Playlist (any source): resolve each track individually with
         *     the custom search and keep only the best match per track.
         */
        if (
            initialResult?.loadType === "playlist" &&
            initialResult.tracks?.length
        ) {
            return this._resolvePlaylist(initialResult, requestUser);
        }

        /*
         * 2c. Link to a single track.
         *     Spotify tracks cannot be played, so they are used as the
         *     reference for the custom search. Any other link is played
         *     exactly as linked.
         */
        const linkedTrack = initialResult?.tracks?.[0];

        if (!linkedTrack || !this._isSpotifyTrack(linkedTrack)) {
            return initialResult ?? this._emptyResult();
        }

        const linkedQuery =
            `${linkedTrack.info?.title ?? ""} ${linkedTrack.info?.author ?? ""}`.trim();

        const { tracks, baseResult } = await this._findTracks(
            linkedQuery,
            requestUser,
            linkedTrack,
            5,
        );

        return this._createResult(tracks, baseResult, 5);
    }

    /**
     * Custom search for a plain text query: Spotify is searched concurrently
     * with the primary provider pipeline, preserving Spotify's reference-only role.
     *
     * @param {string} query
     * @param {string} requestUser
     * @returns {Promise<Object>}
     */
    async _searchTextQuery(query, requestUser) {
        const spotifyPromise = this._safeSearch(
            `spsearch:${query}`,
            requestUser,
            "Spotify",
            4000,
        );

        const { tracks, baseResult } = await this._findTracks(
            query,
            requestUser,
            spotifyPromise,
            5,
        );

        return this._createResult(tracks, baseResult, 5);
    }

    /**
     * Resolve every track of a playlist (from any source) to its best
     * playable match.
     *
     * @param {Object} playlistResult Normal search result with loadType "playlist".
     * @param {string} requestUser
     * @returns {Promise<Object>}
     */
    async _resolvePlaylist(playlistResult, requestUser) {
        const concurrency = 3;

        const playlistTracks = playlistResult.tracks;

        const resolved = await this._mapWithConcurrency(
            playlistTracks,
            concurrency,
            async (playlistTrack) => {
                const title = playlistTrack?.info?.title ?? "";
                const author = playlistTrack?.info?.author ?? "";
                const trackQuery = `${title} ${author}`.trim();

                if (!trackQuery) return null;

                try {
                    let reference = playlistTrack;

                    if (!this._isSpotifyTrack(playlistTrack)) {
                        const referenceResult = await this._safeSearch(
                            `spsearch:${trackQuery}`,
                            requestUser,
                            "Spotify",
                        );

                        reference =
                            referenceResult?.tracks?.[0] ?? playlistTrack;
                    }

                    const { tracks } = await this._findTracks(
                        trackQuery,
                        requestUser,
                        reference,
                        1,
                    );

                    if (!tracks.length) {
                        console.warn(
                            `[SEARCH] No match found for playlist track: ${trackQuery}`,
                        );
                    }
                    
                    return tracks[0] ?? null;
                } catch (error) {
                    console.error(
                        `[SEARCH] Failed to resolve playlist track "${trackQuery}":`,
                        error,
                    );
                    return null;
                }
            },
        );

        const bestTracks = resolved.filter(Boolean);

        return {
            ...playlistResult,
            loadType: bestTracks.length ? "playlist" : "empty",
            exception: null,
            playlist: bestTracks.length
                ? playlistResult.playlist ?? null
                : null,
            tracks: bestTracks,
        };
    }

    /**
     * True if a track comes from Spotify (such tracks are only references).
     */
    _isSpotifyTrack(track) {
        const sourceName = String(track?.info?.sourceName ?? "").toLowerCase();
        const uri = String(track?.info?.uri ?? "").toLowerCase();

        return sourceName.includes("spotify") || uri.includes("spotify.com/");
    }

    /**
     * Find playable tracks for one query.
     *
     * Stage 1: YouTube Music. Its songs are resolved in parallel. If the best
     *          result scores >= 100, the top `maxResults` are returned
     *          immediately and every other provider is skipped.
     * Stage 2: Otherwise all remaining providers and the default source are
     *          searched in parallel. Results are then merged in
     *          searchProviders order, so priority and de-duplication behave
     *          the same as a sequential search.
     *
     * @param {string} query
     * @param {string} requestUser
     * @param {Object|null} primaryTrack Spotify reference track.
     * @param {number} maxResults How many tracks to return (1 = best only).
     * @param {Promise<Object|null>|Object|null} [defaultResultOverride]
     *        Already-running/finished normal search for `query`. If given,
     *        it is used as the default source result instead of searching again.
     * @returns {Promise<{tracks: Object[], baseResult: Object}>}
     */
    async _findTracks(
        query,
        requestUser,
        primaryTrackOrPromise,
        maxResults = 5,
        defaultResultOverride = undefined,
    ) {
        const emptyResult = this._emptyResult();

        const search = (term, label, timeoutMs = 2000) =>
            this._safeSearch(term, requestUser, label, timeoutMs);

        const collectedTracks = [];

        /**
         * Attach reference metadata without modifying playable info.
         */
        const attachMetadata = (track, refTrack) => {
            if (!track || !refTrack?.info) {
                return track;
            }

            return {
                ...track,
                metadata: {
                    ...refTrack.info,
                },
            };
        };

        /**
         * Add unique playable tracks.
         * Spotify tracks are never added as playable candidates.
         */
        const addUniqueTracks = (
            tracks,
            limit = 5,
            source = "unknown",
            refTrack = null,
        ) => {
            let added = 0;

            for (const originalTrack of tracks ?? []) {
                if (!originalTrack?.info) continue;

                const track = {
                    ...originalTrack,
                    searchSource:
                        originalTrack.searchSource ?? source,
                };

                const sourceName = track.info.sourceName
                    ? track.info.sourceName.toLowerCase()
                    : "";

                const trackUri = String(
                    track.info.uri ?? "",
                ).toLowerCase();

                if (
                    sourceName.includes("spotify") ||
                    trackUri.includes("spotify.com/")
                ) {
                    continue;
                }

                const uri = track.info.uri;
                const identifier = track.info.identifier;

                const duplicateIndex = collectedTracks.findIndex(
                    (existing) =>
                        (uri && existing.info?.uri === uri) ||
                        (identifier &&
                            existing.info?.identifier === identifier),
                );

                if (duplicateIndex !== -1) {
                    const existing = collectedTracks[duplicateIndex];

                    if (
                        track.searchSource === "ytmsearch" &&
                        existing.searchSource !== "ytmsearch"
                    ) {
                        collectedTracks[duplicateIndex] =
                            attachMetadata(track, refTrack);
                    }

                    continue;
                }

                collectedTracks.push(attachMetadata(track, refTrack));
                added++;

                if (added >= limit) break;
            }
        };

        /*
         * ==========================================
         * TIER 1: YouTube Music + Spotify Reference
         * Run concurrently in parallel
         * ==========================================
         */
        const ytMusic = this.LavalinkManager.youtubeMusicInstance;

        const ytmResolutionPromise = (async () => {
            if (!ytMusic) {
                console.warn(
                    "[SEARCH] YouTube Music instance is not initialized.",
                );
                return [];
            }

            try {
                const songs =
                    (await this._withTimeout(
                        ytMusic.searchSongs(query, 5),
                        4000,
                        "YouTube Music",
                    )) ?? [];

                const resolvedTracks = (
                    await Promise.all(
                        songs.map(async (song) => {
                            const videoId = song.identifier;

                            if (!videoId) return null;

                            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                            const songResult = await search(
                                `ytsearch:${videoUrl}`,
                                `YouTube Music: ${song.title ?? videoId}`,
                                2500,
                            );

                            const matchedTrack =
                                songResult?.tracks?.find(
                                    (track) =>
                                        track.info?.identifier === videoId,
                                );

                            if (!matchedTrack) {
                                console.warn(
                                    `[SEARCH] Could not resolve YTM video: ${videoId}`,
                                );

                                return null;
                            }

                            return {
                                ...matchedTrack,
                                searchSource: "ytmsearch",
                                yt: {
                                    artists: song.artists ?? [],
                                },
                            };
                        }),
                    )
                ).filter(Boolean);

                return resolvedTracks;
            } catch (error) {
                console.error("[SEARCH] YouTube Music failed:", error);
                return [];
            }
        })();

        // Concurrently await both YTM candidates and Spotify reference
        const [resolvedYtTracks, rawSpotify] = await Promise.all([
            ytmResolutionPromise,
            Promise.resolve(primaryTrackOrPromise),
        ]);

        let primaryTrack = null;
        if (rawSpotify?.tracks && Array.isArray(rawSpotify.tracks)) {
            primaryTrack = rawSpotify.tracks[0] ?? null;
        } else if (rawSpotify?.info) {
            primaryTrack = rawSpotify;
        }

        // Precompute Spotify reference tokens once (Idea 9)
        const refContext = this._precomputeReference(primaryTrack);

        const sortByScore = (tracks) => {
            if (!primaryTrack) return [...tracks];

            return [...tracks].sort(
                (a, b) =>
                    this.scoreTrack(b, primaryTrack, refContext) -
                    this.scoreTrack(a, primaryTrack, refContext),
            );
        };

        const scoredYtTracks = (resolvedYtTracks ?? [])
            .map((track) => ({
                track: attachMetadata(track, primaryTrack),
                score: primaryTrack
                    ? this.scoreTrack(track, primaryTrack, refContext)
                    : 0,
            }))
            .sort((a, b) => b.score - a.score);

        // Check if Tier 1 produced a satisfactory match (score >= 100)
        if (
            primaryTrack &&
            scoredYtTracks.some(({ score }) => score >= 100)
        ) {
            return {
                tracks: scoredYtTracks
                    .slice(0, maxResults)
                    .map(({ track }) => track),
                baseResult: emptyResult,
            };
        }

        addUniqueTracks(resolvedYtTracks, 5, "ytmsearch", primaryTrack);

        /*
         * ==========================================
         * TIER 2: Standard Fallbacks (YouTube & SoundCloud)
         * Run concurrently in parallel with tighter timeout (2000ms)
         * ==========================================
         */
        const tier2Providers = [
            { name: "YouTube", type: "ytsearch" },
            { name: "SoundCloud", type: "scsearch" },
        ];

        const tier2Results = await Promise.all(
            tier2Providers.map((provider) =>
                search(`${provider.type}:${query}`, provider.name, 2000),
            ),
        );

        tier2Results.forEach((result, index) => {
            if (!result?.tracks?.length) return;
            const source = tier2Providers[index].type;

            if (result.loadType === "playlist" && primaryTrack) {
                const bestTrack = sortByScore(result.tracks)[0];

                if (bestTrack) {
                    addUniqueTracks([bestTrack], 1, source, primaryTrack);
                }

                return;
            }

            addUniqueTracks(result.tracks, 5, source, primaryTrack);
        });

        // Check if Tier 2 produced a satisfactory match
        const tier2Satisfactory =
            primaryTrack &&
            collectedTracks.some(
                (track) =>
                    this.scoreTrack(track, primaryTrack, refContext) >= 100,
            );

        if (tier2Satisfactory) {
            const rankedTracks = sortByScore(collectedTracks).slice(
                0,
                maxResults,
            );
            return {
                tracks: rankedTracks,
                baseResult: emptyResult,
            };
        }

        /*
         * ==========================================
         * TIER 3: Extended Fallbacks
         * amsearch, dzsearch, tdsearch, jssearch, bcsearch, default source
         * ==========================================
         */
        const tier3Providers = [
            { name: "Apple Music", type: "amsearch" },
            { name: "Deezer", type: "dzsearch" },
            { name: "Tidal", type: "tdsearch" },
            { name: "JioSaavn", type: "jssearch" },
            { name: "Bandcamp", type: "bcsearch" },
        ];

        const tier3Results = await Promise.all([
            ...tier3Providers.map((provider) =>
                search(`${provider.type}:${query}`, provider.name, 2000),
            ),
            defaultResultOverride !== undefined
                ? Promise.resolve(defaultResultOverride)
                : search(query, "Default source", 2000),
        ]);

        const defaultResult = tier3Results[tier3Results.length - 1];

        tier3Results.forEach((result, index) => {
            if (!result?.tracks?.length) return;

            const isDefault = index === tier3Providers.length;
            const source = isDefault
                ? "default"
                : tier3Providers[index].type;

            if (result.loadType === "playlist" && primaryTrack) {
                const bestTrack = sortByScore(result.tracks)[0];

                if (bestTrack) {
                    addUniqueTracks([bestTrack], 1, source, primaryTrack);
                }

                return;
            }

            addUniqueTracks(result.tracks, 5, source, primaryTrack);
        });

        /*
         * Final result, sorted by score.
         */
        const rankedTracks = sortByScore(collectedTracks).slice(
            0,
            maxResults,
        );

        return {
            tracks: rankedTracks,
            baseResult: defaultResult ?? emptyResult,
        };
    }

    /**
     * Run a Lavalink search safely. Returns null on error or timeout.
     */
    async _safeSearch(
        term,
        requestUser,
        label = "Search",
        timeoutMs = 4000,
    ) {
        try {
            return await this._withTimeout(
                this.search(term, requestUser),
                timeoutMs,
                label,
            );
        } catch (error) {
            console.error(`[SEARCH] ${label} failed:`, error);
            return null;
        }
    }

    /**
     * Resolve with null if the promise takes longer than `ms`.
     */
    _withTimeout(promise, ms, label = "Operation") {
        let timer;

        const timeout = new Promise((resolve) => {
            timer = setTimeout(() => {
                console.warn(
                    `[SEARCH] ${label} timed out after ${ms}ms`,
                );
                resolve(null);
            }, ms);
        });

        return Promise.race([promise, timeout]).finally(() =>
            clearTimeout(timer),
        );
    }

    _emptyResult() {
        return {
            loadType: "empty",
            exception: null,
            pluginInfo: {},
            playlist: null,
            tracks: [],
        };
    }

    /**
     * Return a consistent Lavalink search result.
     */
    _createResult(tracks, baseResult = this._emptyResult(), limit = 5) {
        return {
            ...baseResult,
            loadType: tracks.length ? "search" : "empty",
            exception: null,
            playlist: null,
            tracks: tracks.slice(0, limit),
        };
    }

    /**
     * Map over items with a concurrency limit, preserving order.
     */
    async _mapWithConcurrency(items, limit, fn) {
        const results = new Array(items.length);
        let next = 0;

        const workers = Array.from(
            { length: Math.min(limit, items.length) },
            async () => {
                while (true) {
                    const index = next++;
                    if (index >= items.length) return;
                    results[index] = await fn(items[index], index);
                }
            },
        );

        await Promise.all(workers);

        return results;
    }

    /**
     * Precompute normalized Spotify reference tokens and artist list for scoring.
     *
     * @param {Object|null} primaryTrack
     * @returns {Object|null}
     */
    _precomputeReference(primaryTrack) {
        if (!primaryTrack?.info) return null;

        const normalizedTitle = this._normalizeText(primaryTrack.info.title);
        const titleWords = new Set(
            normalizedTitle ? normalizedTitle.split(/\s+/) : [],
        );

        const referenceArtistNames = String(primaryTrack.info.author ?? "")
            .split(/\s*,\s*|\s+&\s+|\s+feat\.?\s+|\s+x\s+/i)
            .map((name) => this._normalizeText(name))
            .filter(Boolean);

        const normalizedAuthor = this._normalizeText(primaryTrack.info.author);
        const authorWords = new Set(
            normalizedAuthor ? normalizedAuthor.split(/\s+/) : [],
        );

        const referenceDuration = Number(primaryTrack.info.duration ?? 0);

        return {
            primaryTrack,
            normalizedTitle,
            titleWords,
            referenceArtistNames,
            normalizedAuthor,
            authorWords,
            referenceDuration,
        };
    }

    /**
     * Normalizes text by stripping punctuation, bracketed annotations, and noise words.
     *
     * @param {string} text
     * @returns {string}
     */
    _normalizeText(text) {
        return String(text ?? "")
            .toLowerCase()
            .replace(/\(.*?\)|\[.*?\]/g, " ")
            .replace(
                /\b(official|audio|video|lyrics?|hd|4k|visualizer|remaster(ed)?)\b/g,
                " ",
            )
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim();
    }

    /**
     * Score a candidate against the Spotify reference.
     *
     * Title: 0-50 points
     * Artist: 0-30 points
     * Duration: 0-20 points
     * YouTube Music duration bonus: +25 points
     *
     * Maximum possible score: 125.
     *
     * @param {Object} track
     * @param {Object|null} primaryTrack
     * @param {Object|null} [refContext] Optional precomputed reference context.
     * @returns {number}
     */
    scoreTrack(track, primaryTrack, refContext = null) {
        if (!primaryTrack) return 0;
        const ref = refContext ?? this._precomputeReference(primaryTrack);
        if (!ref) return 0;

        const candTitle = this._normalizeText(track.info?.title);
        let titleSimilarity = 0;
        if (candTitle && ref.normalizedTitle) {
            if (candTitle === ref.normalizedTitle) {
                titleSimilarity = 1;
            } else {
                const candWords = new Set(candTitle.split(/\s+/));
                const intersection = [...candWords].filter((w) =>
                    ref.titleWords.has(w),
                ).length;
                const union = new Set([...candWords, ...ref.titleWords]).size;
                titleSimilarity = union ? intersection / union : 0;
            }
        }
        const titleScore = titleSimilarity * 50;

        let artistScore = 0;
        if (track.searchSource === "ytmsearch") {
            const ytArtists = Array.isArray(track.yt?.artists)
                ? track.yt.artists
                : [];

            const normalizedYtArtists = ytArtists
                .map((artist) => this._normalizeText(artist?.name))
                .filter(Boolean);

            const artistMatches = normalizedYtArtists.some((ytArtist) =>
                ref.referenceArtistNames.some(
                    (referenceArtist) => ytArtist === referenceArtist,
                ),
            );

            if (artistMatches) {
                artistScore = 30;
            }
        } else {
            const candAuthor = this._normalizeText(track.info?.author);
            let authorSimilarity = 0;
            if (candAuthor && ref.normalizedAuthor) {
                if (candAuthor === ref.normalizedAuthor) {
                    authorSimilarity = 1;
                } else {
                    const candWords = new Set(candAuthor.split(/\s+/));
                    const intersection = [...candWords].filter((w) =>
                        ref.authorWords.has(w),
                    ).length;
                    const union = new Set([...candWords, ...ref.authorWords]).size;
                    authorSimilarity = union ? intersection / union : 0;
                }
            }
            artistScore = authorSimilarity * 30;
        }

        const candidateDuration = Number(track.info?.duration ?? 0);
        const durationDifference = Math.abs(
            candidateDuration - ref.referenceDuration,
        );

        const durationScore =
            ref.referenceDuration > 0 && candidateDuration > 0
                ? Math.max(0, 1 - durationDifference / ref.referenceDuration) * 20
                : 0;

        const ytMusicDurationBonus =
            track.searchSource === "ytmsearch" &&
            ref.referenceDuration > 0 &&
            candidateDuration > 0 &&
            durationDifference < 1000
                ? 25
                : 0;

        return (
            titleScore +
            artistScore +
            durationScore +
            ytMusicDurationBonus
        );
    }

    /**
     * Resolve the text and voice channels for this player.
     */
    async _resolveChannels() {
        if (!this.client) {
            throw new Error(
                "[PLAYER] Client instance is not available.",
            );
        }

        const guild =
            this.client.guilds.cache.get(this.guildId) ??
            await this.client.guilds
                .fetch(this.guildId)
                .catch(() => null);

        if (!guild) return;

        const textChannel =
            guild.channels.cache.get(this.textChannelId) ??
            await guild.channels
                .fetch(this.textChannelId)
                .catch(() => null);

        const voiceChannel =
            guild.channels.cache.get(this.voiceChannelId) ??
            await guild.channels
                .fetch(this.voiceChannelId)
                .catch(() => null);

        if (textChannel) this.textChannel = textChannel;
        if (voiceChannel) this.voiceChannel = voiceChannel;
    }
}

module.exports = reverbLavalinkPlayer;