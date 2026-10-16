
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
     * Providers are searched sequentially in searchProviders order.
     * If the best YouTube Music result scores >= 100, return
     * the top five YouTube Music results immediately.
     *
     * @param {string} query
     * @param {string} requestUser
     * @returns {Promise<Object>}
     */
    async customReverbSearch(query, requestUser) {
        const searchProviders = [
            { name: "YouTube Music", type: "ytmsearch" },
            { name: "YouTube", type: "ytsearch" },
            { name: "Apple Music", type: "amsearch" },
            { name: "Deezer", type: "dzsearch" },
            { name: "Tidal", type: "tdsearch" },
            { name: "Tidal", type: "tidal" },
            { name: "JioSaavn", type: "jssearch" },
            { name: "SoundCloud", type: "scsearch" },
            { name: "Bandcamp", type: "bcsearch" },
        ];

        const emptyResult = {
            loadType: "empty",
            exception: null,
            pluginInfo: {},
            playlist: null,
            tracks: [],
        };

        /**
         * Run a Lavalink search safely.
         */
        const search = async (term) => {
            try {
                const result = await this.search(term, requestUser);

                return result;
            } catch (error) {
                console.error(`[SEARCH] Search failed:`, error);
                return null;
            }
        };

        
        /*
         * 1. Search Spotify first to get a reference track.
         *    This is used for scoring and filtering results.
         */
        const spotifyResult = await search(
            `spsearch:${query}`,
            "Spotify",
        );

        const primaryTrack = spotifyResult?.tracks?.[0] ?? null;

        const collectedTracks = [];

        /**
         * Attach reference metadata without modifying playable info.
         */
        const attachMetadata = (track) => {
            if (!track || !primaryTrack?.info) {
                return track;
            }

            return {
                ...track,
                metadata: {
                    ...primaryTrack.info,
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
        ) => {
            let added = 0;

            for (const originalTrack of tracks ?? []) {
                if (!originalTrack?.info) continue;

                const track = {
                    ...originalTrack,
                    searchSource:
                        originalTrack.searchSource ?? source,
                };

                const sourceName = track.info.sourceName ? track.info.sourceName.toLowerCase() : "";

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
                            attachMetadata(track);
                    }

                    continue;
                }

                collectedTracks.push(attachMetadata(track));
                added++;

                if (added >= limit) break;
            }
        };

        /**
         * Sort tracks by score, highest first.
         */
        const sortByScore = (tracks) => {
            if (!primaryTrack) return [...tracks];

            return [...tracks].sort(
                (a, b) =>
                    this.scoreTrack(b, primaryTrack) -
                    this.scoreTrack(a, primaryTrack),
            );
        };

        /**
         * Return a consistent Lavalink search result.
         */
        const createResult = (
            tracks,
            baseResult = emptyResult,
        ) => ({
            ...baseResult,
            loadType: tracks.length ? "search" : "empty",
            exception: null,
            playlist: null,
            tracks: tracks.slice(0, 5),
        });

        /*
         * 2. Search every configured provider in order.
            * YouTube Music results are scored immediately.
            * If any YTM result scores >= 100, return the top five YTM results immediately.
            * Otherwise, continue searching other providers and collect unique playable tracks.
        */
        for (const provider of searchProviders) {
            if (provider.type === "ytmsearch") {
                const ytMusic =
                    this.LavalinkManager.youtubeMusicInstance;

                if (!ytMusic) {
                    console.warn(
                        "[SEARCH] YouTube Music instance is not initialized.",
                    );

                    continue;
                }

                try {
                    const songs = await ytMusic.searchSongs(query, 5);

                    const resolvedTracks = [];

                    for (const song of songs ?? []) {
                        const videoId = song.identifier;

                        if (!videoId) continue;

                        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                        const songResult = await search(
                            `ytsearch:${videoUrl}`,
                            `YouTube Music: ${song.title ?? videoId}`,
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

                            continue;
                        }

                        resolvedTracks.push({
                            ...matchedTrack,
                            searchSource: "ytmsearch",
                            yt: {
                                artists: song.artists ?? [],
                            },
                        });
                    }
                    const scoredYtTracks = resolvedTracks
                        .map((track) => ({
                            track: attachMetadata(track),
                            score: primaryTrack
                                ? this.scoreTrack(track, primaryTrack)
                                : 0,
                        }))
                        .sort((a, b) => b.score - a.score);

                    if (
                        primaryTrack &&
                        scoredYtTracks.some(({ score }) => score >= 100)
                    ) {
                        const topYtTracks = scoredYtTracks
                            .slice(0, 5)
                            .map(({ track }) => track);
                        
                        return createResult(topYtTracks);
                    }

                    addUniqueTracks(
                        resolvedTracks,
                        5,
                        "ytmsearch",
                    );
                } catch (error) {
                    console.error(
                        "[SEARCH] YouTube Music failed:",
                        error,
                    );
                }

                continue;
            }

            const result = await search(
                `${provider.type}:${query}`,
                provider.name,
            );

            if (!result?.tracks?.length) continue;

            if (
                result.loadType === "playlist" &&
                primaryTrack
            ) {
                const bestTrack = sortByScore(result.tracks)[0];

                if (bestTrack) {
                    addUniqueTracks(
                        [bestTrack],
                        1,
                        provider.type,
                    );
                }

                continue;
            }

            addUniqueTracks(
                result.tracks,
                5,
                provider.type,
            );
        }

        /*
         * 3. Search the default source after the configured providers.
        */
        const defaultResult = await search(
            query,
            "Default source",
        );

        if (defaultResult?.tracks?.length) {
            if (
                defaultResult.loadType === "playlist" &&
                primaryTrack
            ) {
                const bestTrack = sortByScore(
                    defaultResult.tracks,
                )[0];

                if (bestTrack) {
                    addUniqueTracks([bestTrack], 1, "default");
                }
            } else {
                addUniqueTracks(
                    defaultResult.tracks,
                    5,
                    "default",
                );
            }
        }

        /*
         * 4. Return the final result, sorted by score.
         *    If no tracks were found, return the default result.
         */
        const rankedTracks = sortByScore(collectedTracks);

        return createResult(
            rankedTracks,
            defaultResult ?? emptyResult,
        );
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
     */
    scoreTrack(track, primaryTrack) {
        const normalize = (text) =>
            String(text ?? "")
                .toLowerCase()
                .replace(/\(.*?\)|\[.*?\]/g, " ")
                .replace(
                    /\b(official|audio|video|lyrics?|hd|4k|visualizer|remaster(ed)?)\b/g,
                    " ",
                )
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .trim();

        const similarity = (a, b) => {
            a = normalize(a);
            b = normalize(b);

            if (!a || !b) return 0;
            if (a === b) return 1;

            const wordsA = new Set(a.split(/\s+/));
            const wordsB = new Set(b.split(/\s+/));

            const intersection = [...wordsA].filter(
                (word) => wordsB.has(word),
            ).length;

            const union = new Set([...wordsA, ...wordsB]).size;

            return union ? intersection / union : 0;
        };

        const titleScore =
            similarity(
                track.info?.title,
                primaryTrack.info?.title,
            ) * 50;

        const referenceArtistNames = String(
            primaryTrack.info?.author ?? "",
        )
            .split(/\s*,\s*|\s+&\s+|\s+feat\.?\s+|\s+x\s+/i)
            .map((name) => normalize(name))
            .filter(Boolean);

        let artistScore = 0;

        if (track.searchSource === "ytmsearch") {
            const ytArtists = Array.isArray(track.yt?.artists)
                ? track.yt.artists
                : [];

            const normalizedYtArtists = ytArtists
                .map((artist) => normalize(artist?.name))
                .filter(Boolean);

            const artistMatches = normalizedYtArtists.some(
                (ytArtist) =>
                    referenceArtistNames.some(
                        (referenceArtist) =>
                            ytArtist === referenceArtist,
                    ),
            );

            if (artistMatches) {
                artistScore = 30;
            }
        } else {
            artistScore =
                similarity(
                    track.info?.author,
                    primaryTrack.info?.author,
                ) * 30;
        }

        const referenceDuration =
            primaryTrack.info?.duration ?? 0;

        const candidateDuration =
            track.info?.duration ?? 0;

        const durationDifference = Math.abs(
            candidateDuration - referenceDuration,
        );

        const durationScore =
            referenceDuration > 0 && candidateDuration > 0
                ? Math.max(
                    0,
                    1 - durationDifference / referenceDuration,
                ) * 20
                : 0;

        const ytMusicDurationBonus =
            track.searchSource === "ytmsearch" &&
                referenceDuration > 0 &&
                candidateDuration > 0 &&
                durationDifference < 1000
                ? 25
                : 0;

        const totalScore =
            titleScore +
            artistScore +
            durationScore +
            ytMusicDurationBonus;

        return totalScore;
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