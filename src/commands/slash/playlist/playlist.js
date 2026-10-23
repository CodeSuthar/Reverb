const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits,
    SlashCommandBuilder,
} = require("discord.js");
const { decodeTrack } = require("moonlink.js/dist/src/Util");
const { checkIfSearchResultIsPlaylist, convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

const MAX_PLAYLIST_NAME_LENGTH = 50;

function formatPlaylistName(input) {
    if (!input) return "";
    return input.trim().replace(/\s+/g, "_").toLowerCase();
}

function toV4TrackFormat(track) {
    if (!track) return null;
    if (typeof track === "object" && track.encoded && track.info) {
        return {
            encoded: track.encoded,
            info: {
                title: track.info.title || "Unknown Title",
                author: track.info.author || "Unknown Author",
                length: Number(track.info.length || track.info.duration || 0),
                identifier: track.info.identifier || "",
                isSeekable: track.info.isSeekable !== false,
                isStream: Boolean(track.info.isStream),
                uri: track.info.uri || "",
                artworkUrl: track.info.artworkUrl || track.artworkUrl || null,
                isrc: track.info.isrc || null,
                sourceName: track.info.sourceName || "unknown",
                position: Number(track.info.position || 0),
            },
            pluginInfo: track.pluginInfo || {},
            userData: track.userData || {},
        };
    }

    if (typeof track === "object" && track.encoded) {
        try {
            const decoded = decodeTrack(track.encoded);
            return {
                encoded: track.encoded,
                info: {
                    title: track.title || decoded?.info?.title || "Unknown Title",
                    author: track.author || decoded?.info?.author || "Unknown Author",
                    length: Number(track.duration || decoded?.info?.duration || 0),
                    identifier: track.identifier || decoded?.info?.identifier || "",
                    isSeekable: track.isSeekable !== false,
                    isStream: Boolean(track.isStream),
                    uri: track.uri || decoded?.info?.uri || "",
                    artworkUrl: track.artworkUrl || decoded?.info?.artworkUrl || null,
                    isrc: track.isrc || decoded?.info?.isrc || null,
                    sourceName: track.sourceName || decoded?.info?.sourceName || "unknown",
                    position: Number(track.position || 0),
                },
                pluginInfo: track.pluginInfo || {},
                userData: track.userData || {},
            };
        } catch {
            return null;
        }
    }
    return null;
}

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

function isDuplicateTrack(newTrack, existingTracks) {
    if (!newTrack || !Array.isArray(existingTracks)) return false;
    const newInfo = getTrackInfo(newTrack);
    const newIdentifier = newInfo?.identifier;
    const newUri = newInfo?.uri;

    for (const existing of existingTracks) {
        const existingInfo = getTrackInfo(existing);
        if (newIdentifier && existingInfo?.identifier && newIdentifier === existingInfo.identifier) {
            return true;
        }
        if (newUri && existingInfo?.uri && newUri === existingInfo.uri) {
            return true;
        }
    }
    return false;
}

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Manage, play, and share your personal music playlists.")
        .addSubcommand((sub) =>
            sub
                .setName("create")
                .setDescription("Create a new empty custom playlist.")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist to create").setRequired(true).setMaxLength(MAX_PLAYLIST_NAME_LENGTH)
                )
                .addStringOption((opt) =>
                    opt
                        .setName("privacy")
                        .setDescription("Choose playlist visibility (default: Public)")
                        .setRequired(false)
                        .addChoices(
                            { name: "🌐 Public (Visible & Clonable)", value: "public" },
                            { name: "🔒 Private (Hidden & Unclonable)", value: "private" }
                        )
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("privacy")
                .setDescription("Change a playlist's privacy setting (public or private).")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist").setRequired(true)
                )
                .addStringOption((opt) =>
                    opt
                        .setName("setting")
                        .setDescription("Choose visibility setting")
                        .setRequired(true)
                        .addChoices(
                            { name: "🌐 Public (Visible & Clonable)", value: "public" },
                            { name: "🔒 Private (Hidden & Unclonable)", value: "private" }
                        )
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("delete")
                .setDescription("Permanently delete one of your saved playlists.")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist to delete").setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Add a song to one of your playlists.")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist").setRequired(true)
                )
                .addStringOption((opt) =>
                    opt.setName("song").setDescription("Song name or URL (leave empty to add current playing track)").setRequired(false)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Remove a song from one of your playlists by position.")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist").setRequired(true)
                )
                .addIntegerOption((opt) =>
                    opt.setName("song").setDescription("Position of the song to remove (1-based)").setRequired(true).setMinValue(1)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("list")
                .setDescription("View saved playlists (public in reply, private in DMs).")
                .addUserOption((opt) =>
                    opt.setName("user").setDescription("View public playlists of another user").setRequired(false)
                )
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of a specific playlist to inspect tracks").setRequired(false)
                )
                .addIntegerOption((opt) =>
                    opt.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("load")
                .setDescription("Load and play a saved playlist in your voice channel.")
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of the playlist to play").setRequired(true)
                )
                .addUserOption((opt) =>
                    opt.setName("user").setDescription("The user whose playlist you want to load (default: yourself)").setRequired(false)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("steal")
                .setDescription("Clone someone else's playlist into your own library.")
                .addUserOption((opt) =>
                    opt.setName("user").setDescription("The user whose playlist you want to copy").setRequired(true)
                )
                .addStringOption((opt) =>
                    opt.setName("name").setDescription("Name of their playlist to clone").setRequired(true)
                )
        ),
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: (interaction) => {
        const sub = interaction.options.getSubcommand();
        if (sub === "load") {
            return {
                voice: true,
                sameVoice: true,
            };
        }
        return null;
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const subCommand = interaction.options.getSubcommand();

        try {
            switch (subCommand) {
                case "create": {
                    const rawName = interaction.options.getString("name");
                    const playlistName = formatPlaylistName(rawName);
                    const privacyOption = interaction.options.getString("privacy");
                    const isPrivate = privacyOption === "private";

                    const existing = await client.database.getPlaylist(interaction.user.id, playlistName);
                    if (existing) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You already have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    await client.database.createPlaylist(interaction.user.id, playlistName, isPrivate);

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | **Successfully created ${isPrivate ? `${client.emojiList.lock} private` : `${client.emojiList.public} public`} playlist \`${playlistName}\`.**\n` +
                            `Use \`/playlist add name:${playlistName}\` to add tracks!\n` +
                            `-# *Privacy: ${isPrivate ? "Private (hidden from others & unclonable)" : "Public (visible & clonable)"}. Change anytime with \`/playlist privacy\`.*`
                        );
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "privacy": {
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));
                    const playlist = await client.database.getPlaylist(interaction.user.id, playlistName);

                    if (!playlist) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const setting = interaction.options.getString("setting");
                    const isPrivate = setting === "private";

                    await client.database.setPlaylistPrivacy(interaction.user.id, playlistName, isPrivate);

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | **Playlist \`${playlist.name}\` is now ${isPrivate ? `${client.emojiList.lock} private` : `${client.emojiList.public} public`}!**\n` +
                            (isPrivate
                                ? "• It is hidden when other users view your playlists.\n• It is **unclonable** and cannot be copied by anyone."
                                : "• It is visible in your public playlists and can be cloned by others.")
                        )
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "delete": {
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));
                    const playlist = await client.database.getPlaylist(interaction.user.id, playlistName);

                    if (!playlist) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    await client.database.deletePlaylist(interaction.user.id, playlistName);

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | **Successfully deleted playlist \`${playlistName}\`.**`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "add": {
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));
                    const playlist = await client.database.getPlaylist(interaction.user.id, playlistName);

                    if (!playlist) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const songQuery = interaction.options.getString("song")?.trim();
                    const currentTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];

                    if (!songQuery) {
                        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
                        const currentTrack = guildPlayer?.current;

                        if (!currentTrack || !currentTrack.encoded) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | **Please provide a song name or play music in voice to add the current track.**`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        const v4Track = toV4TrackFormat(currentTrack);
                        if (isDuplicateTrack(v4Track, currentTracks)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | **This track is already in your playlist \`${playlist.name}\`.**`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addTrackToPlaylist(interaction.user.id, playlistName, v4Track);

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | **Added *[${currentTrack.title}](${currentTrack.uri})* to playlist \`${playlist.name}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const searchResult = await client.musicManager.search({
                        query: songQuery,
                        requester: interaction.user,
                    });

                    if (!searchResult || !searchResult.tracks?.length) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **No tracks found for \`${songQuery}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (checkIfSearchResultIsPlaylist(searchResult)) {
                        let addedCount = 0;
                        let duplicateCount = 0;
                        const workingList = [...currentTracks];

                        for (const trk of searchResult.tracks) {
                            const v4Track = toV4TrackFormat(trk);
                            if (v4Track) {
                                if (isDuplicateTrack(v4Track, workingList)) {
                                    duplicateCount++;
                                } else {
                                    workingList.push(v4Track);
                                    await client.database.addTrackToPlaylist(interaction.user.id, playlistName, v4Track);
                                    addedCount++;
                                }
                            }
                        }

                        let desc = `${client.emojiList.tick} | **Added *${addedCount}* songs from playlist *${searchResult.playlistInfo.name}* to \`${playlist.name}\`.**`;
                        if (duplicateCount > 0) desc += `\n${client.emojiList.warning} | Skipped \`${duplicateCount}\` duplicate song(s).`;

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(desc);
                        return await interaction.editReply({ embeds: [emb] });
                    } else {
                        const track = searchResult.tracks[0];
                        const v4Track = toV4TrackFormat(track);

                        if (isDuplicateTrack(v4Track, currentTracks)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | **This track is already in your playlist \`${playlist.name}\`.**`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addTrackToPlaylist(interaction.user.id, playlistName, v4Track);

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to playlist \`${playlist.name}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                }

                case "remove": {
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));
                    const playlist = await client.database.getPlaylist(interaction.user.id, playlistName);

                    if (!playlist) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
                    if (!rawTracks.length) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **Playlist \`${playlist.name}\` is empty.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const songIndex = interaction.options.getInteger("song") - 1;
                    if (songIndex < 0 || songIndex >= rawTracks.length) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **Invalid song index. Must be between 1 and ${rawTracks.length}.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const removed = rawTracks[songIndex];
                    const removedInfo = getTrackInfo(removed);

                    await client.database.removeTrackFromPlaylist(interaction.user.id, playlistName, songIndex);

                    const title = removedInfo?.title || "Unknown Track";
                    const uri = removedInfo?.uri || "#";

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | **Removed *[${title}](${uri})* from \`${playlist.name}\`.**`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "list": {
                    const targetUser = interaction.options.getUser("user") || interaction.user;
                    const inspectingName = interaction.options.getString("name");
                    const isSelf = targetUser.id === interaction.user.id;

                    // Inspecting a specific playlist
                    if (inspectingName) {
                        const specificName = formatPlaylistName(inspectingName);
                        const playlist = await client.database.getPlaylist(targetUser.id, specificName);
                        if (!playlist) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    isSelf
                                        ? `${client.emojiList.cross} | **You do not have a playlist named \`${specificName}\`.**`
                                        : `${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${specificName}\`.**`
                                );
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        if (playlist.isPrivate && !isSelf) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and cannot be viewed.**`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        const rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
                        const maxPreview = 15;
                        const trackLines = [];
                        let totalDurationMs = 0;

                        for (let i = 0; i < rawTracks.length; i++) {
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
                        }

                        if (rawTracks.length > maxPreview) {
                            trackLines.push(`-# *... and ${rawTracks.length - maxPreview} more track(s).*`);
                        }

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setTitle(`${client.emojiList.queue} Playlist: ${playlist.name}`)
                            .setDescription(rawTracks.length ? trackLines.join("\n") : "*This playlist is currently empty.*")
                            .addFields([
                                { name: "Total Songs", value: `\`${rawTracks.length}\``, inline: true },
                                { name: "Total Duration", value: `\`${convertMillisecondsToTime(totalDurationMs)}\``, inline: true },
                                { name: "Privacy", value: playlist.isPrivate ? `${client.emojiList.lock} Private (Unclonable)` : `${client.emojiList.public} Public (Clonable)`, inline: true }
                            ])
                            .setFooter({ text: `Use /playlist load name:${playlist.name} to play this playlist in voice!` })
                            .setTimestamp();

                        if (playlist.isPrivate) {
                            try {
                                await interaction.user.send({ embeds: [emb] });
                                const replyEmb = new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.mail} | **I've sent the details and tracklist of your private playlist \`${playlist.name}\` to your Direct Messages (DMs).**`);
                                return await interaction.editReply({ embeds: [replyEmb] });
                            } catch {
                                const failEmb = new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.warning} | **Could not DM you the details of your private playlist \`${playlist.name}\`. Please check your privacy settings to allow DMs from server members.**`);
                                return await interaction.editReply({ embeds: [failEmb] });
                            }
                        }

                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const allPlaylists = await client.database.getUserPlaylists(targetUser.id);
                    const maxPlaylists = client.config.playlist.maxPlaylistsPerUser;

                    // If viewing another user -> show ONLY public playlists
                    if (!isSelf) {
                        const publicPlaylists = (allPlaylists || []).filter((p) => !p.isPrivate);
                        if (!publicPlaylists.length) {
                            const emb = new EmbedBuilder()
                                .setColor(client?.color?.hex ?? "#FF66C4")
                                .setDescription(`${client.emojiList.note} | **${targetUser.username} has no public playlists.**`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        const lines = publicPlaylists.map((p, idx) => {
                            const count = Array.isArray(p.tracks) ? p.tracks.length : 0;
                            return `\`${idx + 1}.\` ${client.emojiList.public} **${p.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
                        });

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setAuthor({
                                name: `${targetUser.username}'s Public Playlists (${publicPlaylists.length})`,
                                iconURL: targetUser.displayAvatarURL({ dynamic: true }),
                            })
                            .setDescription(lines.join("\n"))
                            .addFields([
                                {
                                    name: "Clone Playlist",
                                    value: `Use \`/playlist steal user:@${targetUser.username} name:<playlist_name>\` to clone any of these playlists!`,
                                }
                            ])
                            .setTimestamp();

                        return await interaction.editReply({ embeds: [emb] });
                    }

                    // Self listing -> Private playlists sent via DM, Public playlists shown in reply!
                    if (!allPlaylists || !allPlaylists.length) {
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(
                                `${client.emojiList.note} | **Your playlist collection is currently empty.**\n` +
                                `Create a new playlist anytime using \`/playlist create\`!`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const publicPlaylists = allPlaylists.filter((p) => !p.isPrivate);
                    const privatePlaylists = allPlaylists.filter((p) => Boolean(p.isPrivate));

                    // DM private playlists
                    let dmSent = false;
                    if (privatePlaylists.length > 0) {
                        const privateLines = privatePlaylists.map((p, idx) => {
                            const count = Array.isArray(p.tracks) ? p.tracks.length : 0;
                            return `\`${idx + 1}.\` ${client.emojiList.lock} **${p.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
                        });

                        const dmEmbed = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setAuthor({
                                name: `Your Private Playlists (${privatePlaylists.length})`,
                                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                            })
                            .setDescription(privateLines.join("\n"))
                            .addFields([
                                {
                                    name: `${client.emojiList.lock} Privacy & Unclonable Protection`,
                                    value:
                                        "• These playlists are hidden from public lists and **cannot be cloned** by others.\n" +
                                        "• Use `/playlist privacy` to toggle visibility.",
                                },
                            ])
                            .setFooter({ text: "Sent via DM to protect your private playlists." })
                            .setTimestamp();

                        try {
                            await interaction.user.send({ embeds: [dmEmbed] });
                            dmSent = true;
                        } catch {
                            dmSent = false;
                        }
                    }

                    // Public playlists in interaction.editReply
                    const publicLines = publicPlaylists.map((p, idx) => {
                        const count = Array.isArray(p.tracks) ? p.tracks.length : 0;
                        return `\`${idx + 1}.\` ${client.emojiList.public} **${p.name}** — \`${count}\` track${count === 1 ? "" : "s"}`;
                    });

                    const replyEmbed = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setAuthor({
                            name: `Your Public Playlists (${publicPlaylists.length}/${maxPlaylists})`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setDescription(
                            publicPlaylists.length > 0
                                ? publicLines.join("\n")
                                : (privatePlaylists.length > 0
                                    ? (dmSent
                                        ? `${client.emojiList.mail} | **I have sent your ${privatePlaylists.length} private playlist${privatePlaylists.length === 1 ? "" : "s"} directly to your Direct Messages (DMs)!**\n\n*You currently do not have any public playlists.*`
                                        : `${client.emojiList.warning} | **Could not DM you your private playlists because your DMs are closed!**\nPlease enable Direct Messages from server members in your privacy settings.`)
                                    : "*You do not have any public playlists.*")
                        );

                    if (privatePlaylists.length > 0) {
                        if (dmSent) {
                            replyEmbed.addFields([
                                {
                                    name: `${client.emojiList.mail} Private Playlists (${privatePlaylists.length})`,
                                    value: `Your **${privatePlaylists.length}** private playlist${privatePlaylists.length === 1 ? "" : "s"} have been sent to your **Direct Messages (DMs)** for privacy!`,
                                },
                            ]);
                        } else {
                            replyEmbed.addFields([
                                {
                                    name: `${client.emojiList.warning} Private Playlists (${privatePlaylists.length})`,
                                    value: `Could not DM your private playlists because your DMs are closed! Please open your DMs to view them.`,
                                },
                            ]);
                        }
                    }

                    replyEmbed.setTimestamp();
                    return await interaction.editReply({ embeds: [replyEmbed] });
                }

                case "load": {
                    const targetUser = interaction.options.getUser("user") || interaction.user;
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));
                    let guildPlayer = await client.musicManager.players.get(interaction.guildId);
                    const voiceChannelToJoin = interaction.member.voice?.channel;

                    if (!voiceChannelToJoin) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You must be connected to a voice channel to load and play a playlist.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const playlist = await client.database.getPlaylist(targetUser.id, playlistName);
                    if (!playlist) {
                        const isSelf = targetUser.id === interaction.user.id;
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                isSelf
                                    ? `${client.emojiList.cross} | **You do not have a playlist named \`${playlistName}\`.**`
                                    : `${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${playlistName}\`.**`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    // Loading a private playlist can ONLY be done by its owner!
                    if (playlist.isPrivate && targetUser.id !== interaction.user.id) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and can only be loaded by its owner.**`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
                    if (!rawTracks.length) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **Playlist \`${playlist.name}\` has no songs saved.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (!guildPlayer) {
                        guildPlayer = await client.musicManager.players.create({
                            guildId: interaction.guildId,
                            voiceChannelId: voiceChannelToJoin.id,
                            textChannelId: interaction.channelId,
                        });
                    }

                    if (!guildPlayer.connected) {
                        await guildPlayer.connect();
                    }

                    let loadedCount = 0;
                    for (const item of rawTracks) {
                        const encoded = typeof item === "string" ? item : item?.encoded;
                        if (!encoded) continue;
                        try {
                            const res = await client.musicManager.search({
                                query: encoded,
                                requester: interaction.user,
                            });
                            if (res?.tracks?.length) {
                                await guildPlayer.queue.add(res.tracks[0]);
                                loadedCount++;
                            }
                        } catch (e) {
                            console.error("Failed to decode playlist track:", e);
                        }
                    }

                    if (!guildPlayer.playing || guildPlayer.paused) {
                        await guildPlayer.play({ paused: false });
                    }

                    const isSelf = targetUser.id === interaction.user.id;
                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | **Successfully loaded \`${loadedCount}\` tracks from playlist \`${playlist.name}\`${isSelf ? "" : ` by **${targetUser.username}**`} into the queue.**`);

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "steal": {
                    const targetUser = interaction.options.getUser("user");
                    const playlistName = formatPlaylistName(interaction.options.getString("name"));

                    if (targetUser.id === interaction.user.id) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You already own this playlist.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const source = await client.database.getPlaylist(targetUser.id, playlistName);
                    if (!source) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **${targetUser.username} does not have a playlist named \`${playlistName}\`.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (source.isPrivate) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **This playlist is ${client.emojiList.lock} private and cannot be cloned.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const existing = await client.database.getPlaylist(interaction.user.id, playlistName);
                    if (existing) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **You already have a playlist named \`${playlistName}\`. Rename or delete it first.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    await client.database.createPlaylist(interaction.user.id, playlistName);
                    const tracksToCopy = Array.isArray(source.tracks) ? source.tracks : [];
                    for (const trk of tracksToCopy) {
                        const v4 = toV4TrackFormat(trk);
                        if (v4) await client.database.addTrackToPlaylist(interaction.user.id, playlistName, v4);
                    }

                    // Notify the target user in DM that their public playlist was cloned
                    try {
                        const notifyEmb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setAuthor({
                                name: "Playlist Cloned!",
                                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                            })
                            .setDescription(
                                `${client.emojiList.hey} Hey **${targetUser.username}**!\n\n` +
                                `User **${interaction.user.tag || interaction.user.username}** (\`${interaction.user.id}\`) just cloned your public playlist **\`${playlistName}\`** in **${interaction.guild?.name || "a Discord server"}**!\n\n` +
                                `${client.emojiList.categories.playlist} **Cloned Playlist:** \`${playlistName}\`\n` +
                                `${client.emojiList.note} **Total Tracks Copied:** \`${tracksToCopy.length}\`\n` +
                                `🏷️ **Saved As:** \`${playlistName}\` by **${interaction.user.username}**`
                            )
                            .setFooter({
                                text: "Your playlist remains safely in your library. Tip: You can set your playlist to private using /playlist privacy to prevent others from cloning it.",
                            })
                            .setTimestamp();

                        await targetUser.send({ embeds: [notifyEmb] }).catch(() => null);
                    } catch (_) {}

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | **Successfully cloned playlist \`${playlistName}\` from ${targetUser.username} with \`${tracksToCopy.length}\` tracks.**`);

                    return await interaction.editReply({ embeds: [emb] });
                }
            }
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred executing the playlist command.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
