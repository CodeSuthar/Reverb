const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { decodeTrack } = require("moonlink.js/dist/src/Util");
const { Track } = require("moonlink.js");
const {
    checkIfSearchResultIsPlaylist,
    convertMillisecondsToTime,
} = require("../../../utils/musicUtils/index");

const MAX_PLAYLIST_NAME_LENGTH = 50;

/**
 * Normalizes a playlist name: converts all whitespace to underscores and lowercases it.
 * E.g. "idk 2" -> "idk_2", "my rock songs" -> "my_rock_songs".
 *
 * @param {string} input
 * @returns {string}
 */
function formatPlaylistName(input) {
    if (!input) return "";
    return input.trim().replace(/\s+/g, "_").toLowerCase();
}

/**
 * Normalizes any Track instance, decoded object, or legacy string into the
 * standard Lavalink/NodeLink v4 JSON track format.
 *
 * Format:
 * {
 *   encoded: string,
 *   info: { title, author, length, identifier, isSeekable, isStream, uri, artworkUrl, isrc, sourceName, position },
 *   pluginInfo: object,
 *   userData: object
 * }
 *
 * @param {import("moonlink.js").Track | object | string} track
 * @returns {object|null}
 */
function toV4TrackFormat(track) {
    if (!track) return null;

    if (typeof track.toJSON === "function") {
        return track.toJSON();
    }

    if (typeof track === "string") {
        try {
            const decoded = decodeTrack(track);
            if (decoded) {
                return {
                    encoded: track,
                    info: decoded.info || {},
                    pluginInfo: decoded.pluginInfo || {},
                    userData: decoded.userData || {},
                };
            }
        } catch {
            return null;
        }
    }

    if (track.encoded && track.info) {
        return {
            encoded: track.encoded,
            info: {
                title: track.info.title || track.title || "Unknown Track",
                author: track.info.author || track.author || "Unknown Artist",
                length: Number(track.info.length || track.info.duration || track.duration || 0),
                identifier: track.info.identifier || track.identifier || "",
                isSeekable: track.info.isSeekable ?? track.isSeekable ?? true,
                isStream: track.info.isStream ?? track.isStream ?? false,
                uri: track.info.uri || track.uri || null,
                artworkUrl: track.info.artworkUrl || track.artworkUrl || null,
                isrc: track.info.isrc || track.isrc || null,
                sourceName: track.info.sourceName || track.sourceName || "unknown",
                position: Number(track.info.position || track.position || 0),
            },
            pluginInfo: track.pluginInfo || {},
            userData: track.userData || {},
        };
    }

    if (track.encoded) {
        return {
            encoded: track.encoded,
            info: {
                title: track.title || "Unknown Track",
                author: track.author || "Unknown Artist",
                length: Number(track.duration || track.length || 0),
                identifier: track.identifier || "",
                isSeekable: track.isSeekable ?? true,
                isStream: track.isStream ?? false,
                uri: track.uri || null,
                artworkUrl: track.artworkUrl || null,
                isrc: track.isrc || null,
                sourceName: track.sourceName || "unknown",
                position: Number(track.position || 0),
            },
            pluginInfo: track.pluginInfo || {},
            userData: track.userData || {},
        };
    }

    return null;
}

/**
 * Extracts track metadata (title, author, uri, length, etc.) from either a
 * v4 track object or a legacy base64 encoded string.
 *
 * @param {object|string} rawTrack
 * @returns {object|null}
 */
function getTrackInfo(rawTrack) {
    if (!rawTrack) return null;
    if (typeof rawTrack === "object" && rawTrack !== null) {
        if (rawTrack.info) return rawTrack.info;
        return rawTrack;
    }
    if (typeof rawTrack === "string") {
        try {
            const decoded = decodeTrack(rawTrack);
            return decoded?.info || null;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Checks whether an encoded string is Lavalink/NodeLink v4 framed.
 * V4 tracks have a non-zero message size in the lower 30 bits of the first 4 bytes.
 *
 * @param {string} encoded
 * @returns {boolean}
 */
function isV4FramedTrack(encoded) {
    if (typeof encoded !== "string" || encoded.length < 8) return false;
    try {
        const buffer = Buffer.from(encoded, "base64");
        if (buffer.length < 4) return false;
        const header = buffer.readInt32BE(0);
        const messageSize = header & 0x3fffffff;
        return messageSize > 0 && messageSize <= buffer.length;
    } catch {
        return false;
    }
}

/**
 * Checks whether a candidate track is already present in a playlist's tracks.
 * Matches by encoded string, URI, audio source identifier, or title + author.
 *
 * @param {object|string} candidate - Track object, decoded info, or encoded string.
 * @param {Array<object|string>} existingTracks - Existing tracks from playlist.
 * @returns {boolean} True if the track is already in the playlist.
 */
function isDuplicateTrack(candidate, existingTracks) {
    if (!candidate || !Array.isArray(existingTracks) || existingTracks.length === 0) {
        return false;
    }

    const candidateEncoded = typeof candidate === "string" ? candidate : candidate.encoded;
    const candidateInfo = getTrackInfo(candidate);
    const candidateUri = candidateInfo?.uri?.trim().toLowerCase();
    const candidateId = candidateInfo?.identifier?.trim();
    const candidateTitle = candidateInfo?.title?.trim().toLowerCase();
    const candidateAuthor = candidateInfo?.author?.trim().toLowerCase();

    for (const existing of existingTracks) {
        const existingEncoded = typeof existing === "string" ? existing : existing.encoded;
        if (candidateEncoded && existingEncoded && candidateEncoded === existingEncoded) {
            return true;
        }

        const existingInfo = getTrackInfo(existing);
        if (!existingInfo) continue;

        const existingUri = existingInfo.uri?.trim().toLowerCase();
        if (candidateUri && existingUri && candidateUri === existingUri) {
            return true;
        }

        const existingId = existingInfo.identifier?.trim();
        if (candidateId && existingId && candidateId === existingId) {
            return true;
        }

        const existingTitle = existingInfo.title?.trim().toLowerCase();
        const existingAuthor = existingInfo.author?.trim().toLowerCase();
        if (
            candidateTitle &&
            existingTitle &&
            candidateTitle === existingTitle &&
            candidateAuthor &&
            existingAuthor &&
            candidateAuthor === existingAuthor
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Resolves a single raw track (v4 object or legacy string) into a playable Track instance.
 * - If the track has valid v4 framing, instantiates it directly.
 * - If it has a legacy v3 format, invalid framing, or decode failure, re-resolves it live via search.
 *
 * @param {object|string} rawTrack
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").User} requester
 * @returns {Promise<{ track: import("moonlink.js").Track | null, v4Data: object | null, wasReResolved: boolean }>}
 */
async function resolveTrackForPlayback(rawTrack, client, requester) {
    if (!rawTrack) return { track: null, v4Data: null, wasReResolved: false };

    const encoded = typeof rawTrack === "string" ? rawTrack : rawTrack?.encoded;

    // Fast path: If already valid v4 message framing, instantiate directly
    if (isV4FramedTrack(encoded)) {
        try {
            const trackData = typeof rawTrack === "object" ? rawTrack : decodeTrack(encoded);
            if (trackData) {
                const track = new Track(trackData, requester);
                return { track, v4Data: toV4TrackFormat(track), wasReResolved: false };
            }
        } catch {
            // Fall through to live search resolution below
        }
    }

    // Resolution path: Stale v3 format, missing framing, or decode error -> re-resolve via live search
    const info = getTrackInfo(rawTrack);
    const searchQuery = info?.uri || (info?.title ? `${info.title} ${info.author || ""}`.trim() : null) || (typeof rawTrack === "string" ? rawTrack : null);

    if (searchQuery) {
        try {
            const searchResult = await client.musicManager.search({
                query: searchQuery,
                requester,
            });

            if (searchResult && Array.isArray(searchResult.tracks) && searchResult.tracks.length > 0) {
                const freshTrack = searchResult.tracks[0];
                return { track: freshTrack, v4Data: toV4TrackFormat(freshTrack), wasReResolved: true };
            }
        } catch (searchErr) {
            console.error(`Failed to re-resolve track for query "${searchQuery}":`, searchErr);
        }
    }

    // Fallback: try decoding legacy string if search was unavailable
    if (encoded) {
        try {
            const decoded = decodeTrack(encoded);
            if (decoded) {
                const track = new Track(decoded, requester);
                return { track, v4Data: toV4TrackFormat(track), wasReResolved: false };
            }
        } catch {
            // Unresolvable
        }
    }

    return { track: null, v4Data: null, wasReResolved: false };
}

/**
 * Subcommand: create <playlist name> [public | private]
 * E.g. r!playlist create idk 2 -> creates idk_2 (public)
 * E.g. r!playlist create idk 2 private -> creates idk_2 (private)
 */
async function handleCreate(message, args, client, prefix) {
    if (!args.length || !args.join("").trim()) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide a name for your playlist.**\nUsage: \`${prefix}playlist create <playlist_name> [public | private]\` *(e.g. \`${prefix}playlist create idk 2 private\`)*`,
            );

        return message.reply({ embeds: [emb] });
    }

    let isPrivate = false;
    let nameParts = [...args];
    const lastWord = nameParts[nameParts.length - 1]?.toLowerCase();
    if (["private", "priv", "lock", "hidden"].includes(lastWord) && nameParts.length > 1) {
        isPrivate = true;
        nameParts.pop();
    } else if (["public", "pub", "unlock", "visible"].includes(lastWord) && nameParts.length > 1) {
        isPrivate = false;
        nameParts.pop();
    }

    const playlistName = formatPlaylistName(nameParts.join("_"));

    if (!playlistName) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide a valid playlist name.**\nUsage: \`${prefix}playlist create <playlist_name> [public | private]\``,
            );

        return message.reply({ embeds: [emb] });
    }

    if (playlistName.length > MAX_PLAYLIST_NAME_LENGTH) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Playlist name cannot be longer than ${MAX_PLAYLIST_NAME_LENGTH} characters.**`,
            );

        return message.reply({ embeds: [emb] });
    }

    const maxPlaylists = client.config.playlist.maxPlaylistsPerUser;

    try {
        const existingPlaylist = await client.database.getPlaylist(message.author.id, playlistName);
        if (existingPlaylist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You already have a playlist named \`${playlistName}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const userPlaylists = await client.database.getUserPlaylists(message.author.id);
        if (userPlaylists.length >= maxPlaylists) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You have reached the maximum limit of ${maxPlaylists} playlists.**\nDelete an existing playlist with \`${prefix}playlist delete <name>\` to create a new one.`,
                );

            return message.reply({ embeds: [emb] });
        }

        await client.database.createPlaylist(message.author.id, playlistName, isPrivate);

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Successfully created ${isPrivate ? `${client.emojiList.lock} private` : `${client.emojiList.public} public`} playlist \`${playlistName}\`!**\n` +
                `Use \`${prefix}playlist add ${playlistName} <song>\` to add your favorite tracks.\n` +
                `-# *Privacy: ${isPrivate ? "Private (hidden from others & unclonable)" : "Public (visible & clonable)"}. Change anytime with \`${prefix}playlist privacy ${playlistName} <public|private>\`.*`,
            )
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist create:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while creating your playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: delete <playlist name>
 * E.g. r!playlist delete idk 2 -> deletes idk_2
 */
async function handleDelete(message, args, client, prefix) {
    if (!args.length || !args.join("").trim()) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide the name of the playlist to delete.**\nUsage: \`${prefix}playlist delete <playlist_name>\``,
            );

        return message.reply({ embeds: [emb] });
    }

    const playlistName = formatPlaylistName(args.join("_"));

    try {
        const playlist = await client.database.getPlaylist(message.author.id, playlistName);
        if (!playlist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**\nUse \`${prefix}playlist list\` to view your saved playlists.`,
                );

            return message.reply({ embeds: [emb] });
        }

        const trackCount = Array.isArray(playlist.tracks) ? playlist.tracks.length : 0;

        await client.database.deleteSongsFromPlaylist(message.author.id, playlistName);
        await client.database.deletePlaylist(message.author.id, playlistName);

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Successfully deleted playlist \`${playlistName}\` (\`${trackCount}\` track${trackCount === 1 ? "" : "s"} removed).**`,
            )
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist delete:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while deleting your playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: add <playlist_name> [song name | url]
 * Saves tracks in full NodeLink/Lavalink v4 format for seamless decoding and persistent compatibility.
 */
async function handleAdd(message, args, client, prefix) {
    const playlistInput = args[0]?.trim();

    if (!playlistInput) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide the playlist name.**\nUsage: \`${prefix}playlist add <playlist_name> [song name | url]\` *(playlist name must be a single argument with \`_\`)*`,
            );

        return message.reply({ embeds: [emb] });
    }

    const playlistName = playlistInput.toLowerCase();
    const maxTracks = client.config.playlist.maxTracksPerPlaylist;

    try {
        const playlist = await client.database.getPlaylist(message.author.id, playlistName);
        if (!playlist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**\nCreate it first using \`${prefix}playlist create ${playlistName}\`.`,
                );

            return message.reply({ embeds: [emb] });
        }

        const currentTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
        if (currentTracks.length >= maxTracks) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Playlist \`${playlistName}\` has reached the maximum limit of ${maxTracks} songs.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const songQuery = args.slice(1).join(" ").trim();

        // If no song query provided, attempt to add currently playing track in voice
        if (!songQuery) {
            const guildPlayer = await client.musicManager.players.get(message.guildId);
            const currentTrack = guildPlayer?.current;

            if (!currentTrack || !currentTrack.encoded) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Please provide a song name or URL, or play a song in voice to add the current track.**\nUsage: \`${prefix}playlist add ${playlistName} <song title or URL>\``,
                    );

                return message.reply({ embeds: [emb] });
            }

            const v4Track = toV4TrackFormat(currentTrack);

            if (isDuplicateTrack(v4Track, currentTracks)) {
                const trackLink = currentTrack.uri ? `[${currentTrack.title}](${currentTrack.uri})` : `**${currentTrack.title}**`;
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **This song is already in your playlist!**\n${trackLink} is already saved in \`${playlist.name}\`.`,
                    );

                if (currentTrack.artworkUrl) emb.setThumbnail(currentTrack.artworkUrl);

                return message.reply({ embeds: [emb] });
            }

            await client.database.addTracksToPlaylist(message.author.id, playlistName, [v4Track]);

            const trackLink = currentTrack.uri ? `[${currentTrack.title}](${currentTrack.uri})` : `**${currentTrack.title}**`;
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Added current track ${trackLink} to playlist \`${playlist.name}\`!**`,
                )
                .setTimestamp();

            if (currentTrack.artworkUrl) emb.setThumbnail(currentTrack.artworkUrl);

            return message.reply({ embeds: [emb] });
        }

        // Search track via music manager
        const searchResult = await client.musicManager.search({
            query: songQuery,
            requester: message.author,
        });

        if (!searchResult || !Array.isArray(searchResult.tracks) || searchResult.tracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
                );

            return message.reply({ embeds: [emb] });
        }

        if (checkIfSearchResultIsPlaylist(searchResult)) {
            // Filter out tracks that are already in the playlist or duplicate within the batch
            const nonDuplicateTracks = [];
            let duplicateCount = 0;

            for (const t of searchResult.tracks) {
                const v4 = toV4TrackFormat(t);
                if (!v4) continue;
                if (isDuplicateTrack(v4, currentTracks) || isDuplicateTrack(v4, nonDuplicateTracks)) {
                    duplicateCount++;
                } else {
                    nonDuplicateTracks.push(v4);
                }
            }

            if (nonDuplicateTracks.length === 0) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **All \`${searchResult.tracks.length}\` track(s) from this playlist are already in \`${playlist.name}\`!**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            const availableSpace = maxTracks - currentTracks.length;
            const tracksToAdd = nonDuplicateTracks.slice(0, availableSpace);

            if (tracksToAdd.length === 0) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Playlist \`${playlist.name}\` has reached the maximum limit of ${maxTracks} songs.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            await client.database.addTracksToPlaylist(message.author.id, playlistName, tracksToAdd);

            const playlistTitle = searchResult.playlistInfo?.name || searchResult.playlist?.title || "External Playlist";
            let desc = `${client.emojiList.tick} | **Added \`${tracksToAdd.length}\` track(s) from playlist *${playlistTitle}* to \`${playlist.name}\`!**`;
            if (duplicateCount > 0) {
                desc += `\n-# Skipped \`${duplicateCount}\` duplicate song(s) that were already in the playlist.`;
            }

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(desc)
                .setTimestamp();

            return message.reply({ embeds: [emb] });
        }

        const track = searchResult.tracks[0];
        const v4Track = toV4TrackFormat(track);

        if (!v4Track || !v4Track.encoded) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Failed to resolve track data for \`${track.title}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        if (isDuplicateTrack(v4Track, currentTracks)) {
            const trackLink = track.uri ? `[${track.title}](${track.uri})` : `**${track.title}**`;
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **This song is already in your playlist!**\n${trackLink} is already saved in \`${playlist.name}\`.`,
                );

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return message.reply({ embeds: [emb] });
        }

        await client.database.addTracksToPlaylist(message.author.id, playlistName, [v4Track]);

        const trackLink = track.uri ? `[${track.title}](${track.uri})` : `**${track.title}**`;
        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Added ${trackLink} to playlist \`${playlist.name}\`!**`,
            )
            .setTimestamp();

        if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist add:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while adding the song to your playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: remove <playlist_name> <track position (1, 2...) | song name>
 * Supports removing tracks from v4 objects or legacy strings.
 */
async function handleRemove(message, args, client, prefix) {
    const playlistInput = args[0]?.trim();

    if (!playlistInput) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide the playlist name.**\nUsage: \`${prefix}playlist remove <playlist_name> <track number | song title>\` *(playlist name must be a single argument with \`_\`)*`,
            );

        return message.reply({ embeds: [emb] });
    }

    const playlistName = playlistInput.toLowerCase();
    const query = args.slice(1).join(" ").trim();

    if (!query) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please specify the track position number or song name to remove.**\nUsage: \`${prefix}playlist remove ${playlistName} <track number | song title>\``,
            );

        return message.reply({ embeds: [emb] });
    }

    try {
        const playlist = await client.database.getPlaylist(message.author.id, playlistName);
        if (!playlist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**\nUse \`${prefix}playlist list\` to view your playlists.`,
                );

            return message.reply({ embeds: [emb] });
        }

        const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
        if (tracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Playlist \`${playlist.name}\` has no songs to remove.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        let targetTrackToRemove = null;
        let targetTitle = "Unknown Track";
        let removedPosition = null;

        // Strategy 1: Check if the query is a numeric position (1-based index)
        const numericIndex = parseInt(query, 10);
        if (!isNaN(numericIndex) && String(numericIndex) === query) {
            if (numericIndex < 1 || numericIndex > tracks.length) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Invalid track position \`${query}\`.**\nPlease provide a number between \`1\` and \`${tracks.length}\`.`,
                    );

                return message.reply({ embeds: [emb] });
            }

            targetTrackToRemove = tracks[numericIndex - 1];
            removedPosition = numericIndex;

            const info = getTrackInfo(targetTrackToRemove);
            targetTitle = info?.title || `Track #${removedPosition}`;
        } else {
            // Strategy 2: Match by song title, author, or URL
            const lowerQuery = query.toLowerCase();

            for (let i = 0; i < tracks.length; i++) {
                const item = tracks[i];
                const info = getTrackInfo(item);
                if (
                    info &&
                    (info.title?.toLowerCase().includes(lowerQuery) ||
                        info.uri?.toLowerCase() === lowerQuery ||
                        info.author?.toLowerCase().includes(lowerQuery))
                ) {
                    targetTrackToRemove = item;
                    targetTitle = info.title || query;
                    removedPosition = i + 1;
                    break;
                }
            }
        }

        if (!targetTrackToRemove) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **No track matching \`${query}\` was found in playlist \`${playlist.name}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        await client.database.removeSong(message.author.id, playlistName, targetTrackToRemove);

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Successfully removed track #${removedPosition} (\`${targetTitle}\`) from playlist \`${playlist.name}\`!**`,
            )
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist remove:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while removing the song from your playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: privacy <playlist name> [public | private]
 * Sets or toggles whether a playlist is public or private.
 */
async function handlePrivacy(message, args, client, prefix, forcedMode = null) {
    if (!args.length || !args.join("").trim()) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please specify the playlist name.**\nUsage: \`${prefix}playlist privacy <playlist_name> [public | private]\`\n*(Private playlists are hidden from other users and cannot be cloned)*`,
            );

        return message.reply({ embeds: [emb] });
    }

    let targetPrivacy = forcedMode;
    let nameParts = [...args];

    if (targetPrivacy === null && nameParts.length > 1) {
        const last = nameParts[nameParts.length - 1]?.toLowerCase();
        if (["private", "priv", "lock", "hidden"].includes(last)) {
            targetPrivacy = true;
            nameParts.pop();
        } else if (["public", "pub", "unlock", "visible"].includes(last)) {
            targetPrivacy = false;
            nameParts.pop();
        }
    }

    const playlistName = formatPlaylistName(nameParts.join("_"));

    try {
        const playlist = await client.database.getPlaylist(message.author.id, playlistName);
        if (!playlist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const isPrivate = targetPrivacy !== null ? targetPrivacy : !playlist.isPrivate;
        await client.database.setPlaylistPrivacy(message.author.id, playlistName, isPrivate);

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Playlist \`${playlist.name}\` is now ${isPrivate ? `${client.emojiList.lock} private` : `${client.emojiList.public} public`}!**\n` +
                (isPrivate
                    ? "• It is hidden when other users view your playlists.\n• It is **unclonable** and cannot be copied by anyone."
                    : "• It is visible in your public playlists and can be cloned by others."),
            )
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist privacy:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while updating playlist privacy.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: list [@user | playlist name]
 * E.g. r!playlist list idk 2 -> inspects idk_2
 * E.g. r!playlist list -> lists own playlists (public in reply, private in DMs)
 * E.g. r!playlist list @User -> lists only public playlists of @User
 */
async function handleList(message, args, client, prefix) {
    let targetUser = message.author;
    let inspectingPlaylistName = null;

    if (args[0]) {
        const mentionMatch = args[0].match(/^<@!?(\d+)>$/);
        const isSnowflake = /^\d{17,20}$/.test(args[0]);

        if (mentionMatch || isSnowflake) {
            const targetId = mentionMatch ? mentionMatch[1] : args[0];
            const fetched = client.users.cache.get(targetId) || (await client.users.fetch(targetId).catch(() => null));
            if (fetched) {
                targetUser = fetched;
                if (args[1]) {
                    inspectingPlaylistName = formatPlaylistName(args.slice(1).join("_"));
                }
            } else if (mentionMatch) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Could not find the specified user.**`,
                    );

                return message.reply({ embeds: [emb] });
            } else {
                // If it's a numeric string that isn't a user, treat it as a playlist name
                inspectingPlaylistName = formatPlaylistName(args.join("_"));
            }
        } else {
            inspectingPlaylistName = formatPlaylistName(args.join("_"));
        }
    }

    try {
        // Case 1: Inspect a specific playlist's contents
        if (inspectingPlaylistName) {
            const playlist = await client.database.getPlaylist(targetUser.id, inspectingPlaylistName);
            if (!playlist) {
                const isSelf = targetUser.id === message.author.id;
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        isSelf
                            ? `${client.emojiList.cross} | **You do not have a playlist named \`${inspectingPlaylistName}\`.**\nUse \`${prefix}playlist list\` to view your available playlists.`
                            : `${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${inspectingPlaylistName}\`.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            // If playlist is private and requested by another user, deny access!
            if (playlist.isPrivate && targetUser.id !== message.author.id) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and cannot be viewed.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            const rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];

            if (rawTracks.length === 0) {
                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setTitle(`${client.emojiList.queue} Playlist: ${playlist.name}`)
                    .setDescription(
                        `*This playlist is currently empty.*\nAdd songs with \`${prefix}playlist add ${playlist.name} <song title or URL>\`.`,
                    )
                    .addFields([
                        {
                            name: "Privacy",
                            value: playlist.isPrivate ? `${client.emojiList.lock} Private (Unclonable)` : `${client.emojiList.public} Public (Clonable)`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (playlist.isPrivate) {
                    try {
                        await message.author.send({ embeds: [emb] });
                        const replyEmb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(
                                `${client.emojiList.mail} | **I've sent the details of your private playlist \`${playlist.name}\` to your Direct Messages (DMs).**`,
                            );
                        return message.reply({ embeds: [replyEmb] });
                    } catch {
                        const failEmb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.warning} | **Could not DM you the details of your private playlist \`${playlist.name}\`. Please check your privacy settings to allow DMs from server members.**`,
                            );
                        return message.reply({ embeds: [failEmb] });
                    }
                }

                return message.reply({ embeds: [emb] });
            }

            const trackLines = [];
            const maxPreview = 15;
            let totalDurationMs = 0;

            for (let i = 0; i < rawTracks.length; i++) {
                try {
                    const info = getTrackInfo(rawTracks[i]);
                    if (info) {
                        totalDurationMs += Number(info.length || info.duration || 0);
                        if (i < maxPreview) {
                            const dur = info.length || info.duration ? convertMillisecondsToTime(info.length || info.duration) : "Unknown";
                            const title = info.title || "Unknown Track";
                            const uri = info.uri ? `[${title}](${info.uri})` : title;
                            trackLines.push(`\`${i + 1}.\` **${uri}** \`(${dur})\``);
                        }
                    } else if (i < maxPreview) {
                        trackLines.push(`\`${i + 1}.\` **Unknown Track**`);
                    }
                } catch {
                    if (i < maxPreview) {
                        trackLines.push(`\`${i + 1}.\` **Unknown Track**`);
                    }
                }
            }

            if (rawTracks.length > maxPreview) {
                trackLines.push(`-# *... and ${rawTracks.length - maxPreview} more track(s).*`);
            }

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setTitle(`${client.emojiList.queue} Playlist: ${playlist.name}`)
                .setDescription(trackLines.join("\n"))
                .addFields([
                    {
                        name: "Total Songs",
                        value: `\`${rawTracks.length}\``,
                        inline: true,
                    },
                    {
                        name: "Total Duration",
                        value: `\`${convertMillisecondsToTime(totalDurationMs)}\``,
                        inline: true,
                    },
                    {
                        name: "Privacy",
                        value: playlist.isPrivate ? `${client.emojiList.lock} Private (Unclonable)` : `${client.emojiList.public} Public (Clonable)`,
                        inline: true,
                    },
                ])
                .setFooter({
                    text: `Use ${prefix}playlist load ${playlist.name} to play this playlist in voice!`,
                })
                .setTimestamp();

            if (playlist.isPrivate) {
                try {
                    await message.author.send({ embeds: [emb] });
                    const replyEmb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `${client.emojiList.mail} | **I've sent the details and tracklist of your private playlist \`${playlist.name}\` to your Direct Messages (DMs).**`,
                        );
                    return message.reply({ embeds: [replyEmb] });
                } catch {
                    const failEmb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.warning} | **Could not DM you the details of your private playlist \`${playlist.name}\`. Please check your privacy settings to allow DMs from server members.**`,
                        );
                    return message.reply({ embeds: [failEmb] });
                }
            }

            return message.reply({ embeds: [emb] });
        }

        // Case 2: List playlists
        const allPlaylists = await client.database.getUserPlaylists(targetUser.id);
        const isSelf = targetUser.id === message.author.id;
        const maxPlaylists = client.config.playlist.maxPlaylistsPerUser;

        // If inspecting another user -> show ONLY public playlists
        if (!isSelf) {
            const publicPlaylists = (allPlaylists || []).filter((pl) => !pl.isPrivate);

            if (publicPlaylists.length === 0) {
                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.note} | **${targetUser.username} has no public playlists.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            const publicLines = publicPlaylists.map((pl, idx) => {
                const count = Array.isArray(pl.tracks) ? pl.tracks.length : 0;
                return `\`${idx + 1}.\` ${client.emojiList.public} **${pl.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
            });

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: `${targetUser.username}'s Public Playlists (${publicPlaylists.length})`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(publicLines.join("\n"))
                .addFields([
                    {
                        name: "Clone Playlist",
                        value: `Use \`${prefix}playlist steal @${targetUser.username} <playlist_name>\` to clone any of these playlists into your personal library!`,
                        inline: false,
                    },
                ])
                .setTimestamp();

            return message.reply({ embeds: [emb] });
        }

        // When listing for themselves -> Private playlists are DM'd and Public are shown in reply!
        if (!allPlaylists || allPlaylists.length === 0) {
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.note} | **Your playlist collection is currently empty.**\n` +
                    `Create a new playlist anytime using \`${prefix}playlist create <name> [public|private]\`!`,
                );

            return message.reply({ embeds: [emb] });
        }

        const publicPlaylists = allPlaylists.filter((pl) => !pl.isPrivate);
        const privatePlaylists = allPlaylists.filter((pl) => Boolean(pl.isPrivate));

        // 1. Send private playlists via DM if any exist
        let dmSent = false;
        if (privatePlaylists.length > 0) {
            const privateLines = privatePlaylists.map((pl, idx) => {
                const count = Array.isArray(pl.tracks) ? pl.tracks.length : 0;
                return `\`${idx + 1}.\` ${client.emojiList.lock} **${pl.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
            });

            const dmEmbed = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: `Your Private Playlists (${privatePlaylists.length})`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(privateLines.join("\n"))
                .addFields([
                    {
                        name: `${client.emojiList.lock} Privacy & Unclonable Protection`,
                        value:
                            `• These playlists are hidden when other users view your profile.\n` +
                            `• These playlists are **unclonable** and cannot be copied by others.\n` +
                            `• To make public: \`${prefix}playlist privacy <name> public\``,
                        inline: false,
                    },
                    {
                        name: "Quick Actions",
                        value:
                            `• **Load:** \`${prefix}playlist load <name>\`\n` +
                            `• **Inspect:** \`${prefix}playlist list <name>\`\n` +
                            `• **Add Song:** \`${prefix}playlist add <name> [song]\``,
                        inline: false,
                    },
                ])
                .setFooter({ text: "Sent via DM to protect your private playlists." })
                .setTimestamp();

            try {
                await message.author.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch {
                dmSent = false;
            }
        }

        // 2. Render public playlists in channel reply
        const publicLines = publicPlaylists.map((pl, idx) => {
            const count = Array.isArray(pl.tracks) ? pl.tracks.length : 0;
            return `\`${idx + 1}.\` ${client.emojiList.public} **${pl.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
        });

        const replyEmbed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `Your Public Playlists (${publicPlaylists.length}/${maxPlaylists})`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                publicPlaylists.length > 0
                    ? publicLines.join("\n")
                    : (privatePlaylists.length > 0
                        ? (dmSent
                            ? `${client.emojiList.mail} | **I have sent your ${privatePlaylists.length} private playlist${privatePlaylists.length === 1 ? "" : "s"} directly to your Direct Messages (DMs)!**\n\n*You currently do not have any public playlists.*`
                            : `${client.emojiList.warning} | **Could not DM you your private playlists because your DMs are closed!**\nPlease enable Direct Messages from server members in your privacy settings.`)
                        : `*You do not have any public playlists.*`)
            );

        if (privatePlaylists.length > 0) {
            if (dmSent) {
                replyEmbed.addFields([
                    {
                        name: `${client.emojiList.mail} Private Playlists (${privatePlaylists.length})`,
                        value: `Your **${privatePlaylists.length}** private playlist${privatePlaylists.length === 1 ? "" : "s"} have been sent to your **Direct Messages (DMs)** for privacy!`,
                        inline: false,
                    },
                ]);
            } else {
                replyEmbed.addFields([
                    {
                        name: `${client.emojiList.warning} Private Playlists (${privatePlaylists.length})`,
                        value: `Could not DM your **${privatePlaylists.length}** private playlist${privatePlaylists.length === 1 ? "" : "s"} because your DMs are closed! Please open your DMs to view them.`,
                        inline: false,
                    },
                ]);
            }
        }

        replyEmbed.addFields([
            {
                name: "Quick Actions",
                value:
                    `• **Load:** \`${prefix}playlist load <playlist_name>\`\n` +
                    `• **Inspect:** \`${prefix}playlist list <playlist_name>\`\n` +
                    `• **Change Privacy:** \`${prefix}playlist privacy <playlist_name> <public|private>\`\n` +
                    `• **Create New:** \`${prefix}playlist create <playlist_name> [public|private]\``,
                inline: false,
            },
        ]);
        replyEmbed.setTimestamp();

        return message.reply({ embeds: [replyEmbed] });
    } catch (err) {
        console.error("Error in playlist list:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while fetching playlists.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: load [@user | userId] <playlist name>
 * E.g. r!playlist load idk 2 -> loads idk_2
 * E.g. r!playlist load @Friend vibes -> loads Friend's public playlist vibes
 * Resolves tracks into playable NodeLink/Lavalink v4 formats, auto-upgrades legacy playlists, and connects safely.
 * Private playlists can ONLY be loaded by their owner.
 */
async function handleLoad(message, args, client, prefix) {
    let guildPlayer = await client.musicManager.players.get(message.guildId);

    if (!args.length || !args.join("").trim()) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please provide the name of the playlist to load.**\nUsage: \`${prefix}playlist load [@user | userId] <playlist_name>\``,
            );

        return message.reply({ embeds: [emb] });
    }

    let targetUser = message.author;
    let playlistName = null;

    if (args.length > 1) {
        const mentionMatch = args[0].match(/^<@!?(\d+)>$/);
        const isSnowflake = /^\d{17,20}$/.test(args[0]);
        if (mentionMatch || isSnowflake) {
            const targetId = mentionMatch ? mentionMatch[1] : args[0];
            const fetched = client.users.cache.get(targetId) || (await client.users.fetch(targetId).catch(() => null));
            if (fetched) {
                targetUser = fetched;
                playlistName = formatPlaylistName(args.slice(1).join("_"));
            }
        }
    }

    if (!playlistName) {
        playlistName = formatPlaylistName(args.join("_"));
    }

    const voiceChannelToJoin = message.member.voice?.channel;
    if (!voiceChannelToJoin) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **You must be connected to a voice channel to load and play a playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }

    try {
        const playlist = await client.database.getPlaylist(targetUser.id, playlistName);

        if (!playlist) {
            const isSelf = targetUser.id === message.author.id;
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    isSelf
                        ? `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**\nUse \`${prefix}playlist list\` to check your available playlists.`
                        : `${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${playlistName}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Loading a private playlist can ONLY be done by its owner!
        if (playlist.isPrivate && targetUser.id !== message.author.id) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and can only be loaded by its owner.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
        if (rawTracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Playlist \`${playlist.name}\` has no songs saved.**\nAdd songs first with \`${prefix}playlist add ${playlist.name} <song title or URL>\`.`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Connect to voice channel first
        if (!guildPlayer) {
            guildPlayer = await client.musicManager.players.create({
                guildId: message.guildId,
                voiceChannelId: voiceChannelToJoin.id,
                textChannelId: message.channelId,
            });
        }

        if (!guildPlayer.connected) {
            await guildPlayer.connect();
        }

        // Inform user that tracks are resolving
        const loadingMsg = await message.reply({
            content: `${client.emojiList.loading} | Loading and verifying **${rawTracks.length} song(s)** from playlist \`${playlist.name}\`...`,
        }).catch(() => null);

        const loadedTracks = [];
        const upgradedV4List = [];
        let needsUpgrade = false;
        let totalDurationMs = 0;

        // Resolve tracks (supports v4 objects and re-resolves legacy v3 tracks live)
        for (const raw of rawTracks) {
            const { track, v4Data, wasReResolved } = await resolveTrackForPlayback(raw, client, message.author);
            if (track) {
                loadedTracks.push(track);
                totalDurationMs += Number(track.duration || track.length || 0);
            }
            if (v4Data) {
                upgradedV4List.push(v4Data);
            }
            if (wasReResolved || typeof raw === "string") {
                needsUpgrade = true;
            }
        }

        if (loadedTracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Failed to resolve playable tracks from playlist \`${playlist.name}\`.**`,
                );

            if (loadingMsg) {
                return loadingMsg.edit({ content: null, embeds: [emb] });
            }
            return message.reply({ embeds: [emb] });
        }

        // Silently upgrade the playlist in the database to v4 format for fast future loads
        if (needsUpgrade && upgradedV4List.length > 0) {
            client.database.setTracksInPlaylist(message.author.id, playlistName, upgradedV4List).catch((err) => {
                console.warn(`[PLAYLIST] Failed to auto-upgrade playlist ${playlistName} to v4:`, err);
            });
        }

        // Add all resolved tracks to queue
        await guildPlayer.queue.add(loadedTracks);

        // Start playback if idle
        if (!guildPlayer.playing || guildPlayer.paused) {
            try {
                const playSuccess = await guildPlayer.play({ paused: false });
                if (!playSuccess && loadedTracks[0]) {
                    // Retry with a fresh live search if initial play encountered an issue
                    const first = loadedTracks[0];
                    const query = first.uri || `${first.title} ${first.author}`;
                    const fresh = await client.musicManager.search({ query, requester: message.author }).catch(() => null);
                    if (fresh && fresh.tracks?.length) {
                        await guildPlayer.play({ track: fresh.tracks[0], paused: false }).catch(() => null);
                    }
                }
            } catch (playErr) {
                console.error("[PLAYLIST] Error starting playback:", playErr);
            }
        }

        const isSelf = targetUser.id === message.author.id;
        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Successfully loaded playlist \`${playlist.name}\`${isSelf ? "" : ` by **${targetUser.username}**`} into the queue!**`,
            )
            .addFields([
                {
                    name: "Tracks Queued",
                    value: `\`${loadedTracks.length}\``,
                    inline: true,
                },
                {
                    name: "Total Duration",
                    value: `\`${convertMillisecondsToTime(totalDurationMs)}\``,
                    inline: true,
                },
                {
                    name: "Requested By",
                    value: `${message.member}`,
                    inline: true,
                },
            ])
            .setTimestamp();

        if (loadingMsg) {
            return loadingMsg.edit({ content: null, embeds: [emb] });
        }
        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist load:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while loading your playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Subcommand: steal <@user | user id> <playlist_name> [new_name]
 * Target playlist name and new playlist name must be single arguments with _ (no spaces).
 */
async function handleSteal(message, args, client, prefix) {
    if (!args[0]) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please specify the user whose playlist you want to copy.**\nUsage: \`${prefix}playlist steal <@user | user id> <playlist_name> [new_name]\` *(playlist names must be single arguments with \`_\`)*`,
            );

        return message.reply({ embeds: [emb] });
    }

    const mentionMatch = args[0].match(/^<@!?(\d+)>$/);
    const cleanId = args[0].replace(/[<@!>]/g, "");
    const targetId = mentionMatch ? mentionMatch[1] : (/^\d{17,20}$/.test(cleanId) ? cleanId : (message.mentions?.users?.first?.()?.id || null));

    if (!targetId) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Invalid user mentioned.** Please mention a user or provide a valid Discord user ID.`,
            );

        return message.reply({ embeds: [emb] });
    }

    const targetUser = client.users.cache.get(targetId) || (await client.users.fetch(targetId).catch(() => null));
    if (!targetUser) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Could not find the target user.**`,
            );

        return message.reply({ embeds: [emb] });
    }

    if (targetUser.id === message.author.id) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **You cannot copy a playlist from yourself!**`,
            );

        return message.reply({ embeds: [emb] });
    }

    const targetPlaylistName = args[1]?.trim().toLowerCase();
    if (!targetPlaylistName) {
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **Please specify the playlist name to copy.**\nUsage: \`${prefix}playlist steal <@user> <playlist_name> [new_name]\``,
            );

        return message.reply({ embeds: [emb] });
    }

    const newPlaylistName = args[2] ? args[2].trim().toLowerCase() : targetPlaylistName;
    const maxPlaylists = client.config.playlist.maxPlaylistsPerUser;

    try {
        const targetPlaylist = await client.database.getPlaylist(targetUser.id, targetPlaylistName);
        if (!targetPlaylist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${targetPlaylistName}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        if (targetPlaylist.isPrivate) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and cannot be cloned or copied.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const tracks = Array.isArray(targetPlaylist.tracks) ? targetPlaylist.tracks : [];
        if (tracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **${targetUser.username}'s playlist \`${targetPlaylistName}\` is empty.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        const existingUserPlaylist = await client.database.getPlaylist(message.author.id, newPlaylistName);
        if (existingUserPlaylist) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You already have a playlist named \`${newPlaylistName}\`.**\nPlease specify a different new name: \`${prefix}playlist steal @${targetUser.username} ${targetPlaylistName} <new_name>\``,
                );

            return message.reply({ embeds: [emb] });
        }

        const userPlaylists = await client.database.getUserPlaylists(message.author.id);
        if (userPlaylists.length >= maxPlaylists) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **You have reached the maximum limit of ${maxPlaylists} playlists.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Convert tracks to clean v4 format when cloning
        const v4Tracks = tracks.map(toV4TrackFormat).filter(Boolean);
        await client.database.createPlaylistWithTracks(message.author.id, newPlaylistName, v4Tracks);

        // Notify the target user in DM that their public playlist was cloned
        try {
            const notifyEmb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: "Playlist Cloned!",
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(
                    `${client.emojiList.hey} Hey **${targetUser.username}**!\n\n` +
                    `User **${message.author.tag || message.author.username}** (\`${message.author.id}\`) just cloned your public playlist **\`${targetPlaylist.name}\`** in **${message.guild?.name || "a Discord server"}**!\n\n` +
                    `${client.emojiList.categories.playlist} **Cloned Playlist:** \`${targetPlaylist.name}\`\n` +
                    `${client.emojiList.note} **Total Tracks Copied:** \`${v4Tracks.length}\`\n` +
                    `🏷️ **Saved As:** \`${newPlaylistName}\` by **${message.author.username}**`
                )
                .setFooter({
                    text: "Your playlist remains safely in your library. Tip: You can set your playlist to private using the privacy command to prevent others from cloning it.",
                })
                .setTimestamp();

            await targetUser.send({ embeds: [notifyEmb] }).catch(() => null);
        } catch (_) {}

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Successfully copied \`${targetUser.username}\`'s playlist \`${targetPlaylist.name}\` (\`${v4Tracks.length}\` songs) as \`${newPlaylistName}\`!**`,
            )
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist steal:", err);
        const emb = new EmbedBuilder()
            .setColor("Red")
            .setDescription(
                `${client.emojiList.cross} | **An error occurred while copying the playlist.**`,
            );

        return message.reply({ embeds: [emb] });
    }
}

/**
 * Dashboard & Help View
 */
async function handleHelp(message, client, prefix) {
    try {
        const userPlaylists = await client.database.getUserPlaylists(message.author.id);
        const count = userPlaylists.length;
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
        const maxPlaylists = client.config.playlist.maxPlaylistsPerUser;

        const emb = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `${botName} Playlist System`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setDescription(
                `Save, organize, and stream your favorite tracks effortlessly with ${botName} playlists.\n` +
                `You currently have **${count}/${maxPlaylists}** saved playlists.\n\n` +
                `*Note: Playlist names cannot have spaces; multi-word names automatically use underscores (\`_\`).*`,
            )
            .addFields([
                {
                    name: "Subcommands & Usage",
                    value:
                        `• **Create:** \`${prefix}playlist create <playlist_name> [public | private]\`\n` +
                        `• **Privacy:** \`${prefix}playlist privacy <playlist_name> [public | private]\`\n` +
                        `• **Delete:** \`${prefix}playlist delete <playlist_name>\`\n` +
                        `• **Add Song:** \`${prefix}playlist add <playlist_name> [song title or URL]\`\n` +
                        `• **Remove Song:** \`${prefix}playlist remove <playlist_name> <track # | title>\`\n` +
                        `• **List / Inspect:** \`${prefix}playlist list [@user | playlist_name]\`\n` +
                        `• **Load & Play:** \`${prefix}playlist load <playlist_name>\`\n` +
                        `• **Copy / Steal:** \`${prefix}playlist steal <@user> <playlist_name> [new_name]\``,
                    inline: false,
                },
            ])
            .setFooter({
                text: `Tip: Private playlists are hidden from other users, unclonable, and automatically sent to your DMs when you run ${prefix}playlist list!`,
            })
            .setTimestamp();

        return message.reply({ embeds: [emb] });
    } catch (err) {
        console.error("Error in playlist help:", err);
    }
}

module.exports = {
    name: "playlist",
    description: "Manage, play, and share your personal music playlists.",
    usage: "<create | delete | add | remove | list | load | steal | privacy> [arguments]",
    category: "playlist",
    aliases: ["pl"],
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: (message, args) => {
        const sub = args[0]?.toLowerCase();
        if (["load", "play", "p"].includes(sub)) {
            return {
                voice: true,
                sameVoice: true,
            };
        }
        return null;
    },
    run: async (message, args, client, prefix) => {
        const subCommand = args[0]?.toLowerCase();
        const subArgs = args.slice(1);

        switch (subCommand) {
            case "create":
            case "cre":
            case "new":
                return handleCreate(message, subArgs, client, prefix);

            case "delete":
            case "del":
            case "removeplaylist":
                return handleDelete(message, subArgs, client, prefix);

            case "add":
            case "a":
            case "addsong":
                return handleAdd(message, subArgs, client, prefix);

            case "remove":
            case "r":
            case "removesong":
            case "deltrack":
                return handleRemove(message, subArgs, client, prefix);

            case "list":
            case "lst":
            case "show":
            case "all":
            case "view":
                return handleList(message, subArgs, client, prefix);

            case "load":
            case "play":
            case "p":
                return handleLoad(message, subArgs, client, prefix);

            case "steal":
            case "copy":
            case "clone":
                return handleSteal(message, subArgs, client, prefix);

            case "privacy":
            case "priv":
            case "visibility":
            case "status":
                return handlePrivacy(message, subArgs, client, prefix);

            case "private":
                return handlePrivacy(message, subArgs, client, prefix, true);

            case "public":
                return handlePrivacy(message, subArgs, client, prefix, false);

            default:
                return handleHelp(message, client, prefix);
        }
    },
};
