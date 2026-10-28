const {
    EmbedBuilder, PermissionFlagsBits
} = require("discord.js");
const {
    checkIfURIIsYoutubeBased,
    checkIfSearchResultIsPlaylist,
    convertMillisecondsToTime,
    buildSetupView,
} = require("../../utils/musicUtils/index");

module.exports = {
    name: "messageCreate",
    run: async (client, message) => {
        if (!message.guild || !message.channel || !message.id) return;

        let setupData = await client.database.getSetup(message.guildId);

        if (setupData) {
            if (message.author.bot && message.author.id !== client.user.id) {
                return message.delete().catch(() => null);
            }

            let textChannel =
                message.guild.channels.cache.get(setupData.textChannelId) ||
                (await message.guild.channels.fetch(setupData.textChannelId).catch(() => null)) ||
                client.channels.cache.get(setupData.textChannelId) ||
                (await client.channels.fetch(setupData.textChannelId).catch(() => null));

            if (textChannel && message.channelId == textChannel.id) {
                if (message.author.bot) return;

                let songQuery = message.content?.trim();
                if (!songQuery) {
                    return message.delete().catch(() => null);
                }

                // Delete the user's message to keep the song-requests channel clean
                await message.delete().catch(() => null);

                if (!message.member?.voice?.channel) {
                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **You need to be in a voice channel to queue songs.**`,
                        );

                    let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                    if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                    return;
                }

                if (
                    !message.member.voice.channel
                        .permissionsFor(client.user)
                        ?.has([PermissionFlagsBits.Speak, PermissionFlagsBits.Connect])
                ) {
                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **I don't have enough permission to connect/speak in ${message.member.voice.channel}.**`,
                        );

                    let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                    if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                    return;
                }

                let guildPlayer = await client.musicManager.players.get(message.guildId);

                if (
                    guildPlayer &&
                    guildPlayer.connected &&
                    guildPlayer.voiceChannelId !== message.member.voice.channelId
                ) {
                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **I am already connected ${guildPlayer.playing ? "and playing music in" : "to"} <#${guildPlayer.voiceChannelId}>. Please join that channel to listen.**`,
                        );

                    let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                    if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                    return;
                }

                let voiceChannelToJoin = message.member.voice.channel;

                try {
                    if (!guildPlayer) {
                        guildPlayer = await client.musicManager.players.create({
                            guildId: message.guildId,
                            voiceChannelId: voiceChannelToJoin.id,
                            textChannelId: message.channelId,
                        });

                        if (!guildPlayer.connected) await guildPlayer.connect();
                    }

                    if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.**`,
                            )
                            .addFields([
                                {
                                    name: "Alternative Sources",
                                    value:
                                        "**You can use sources like Spotify, SoundCloud, or other supported platforms to play music.**",
                                    inline: false,
                                },
                            ]);

                        let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                        if (m) setTimeout(() => m.delete().catch(() => null), 7000);
                        return;
                    }

                    let searchResult = await client.musicManager.search({
                        query: songQuery,
                        requester: message.author,
                    });

                    if (!searchResult || !searchResult.tracks.length) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
                            );

                        let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                        if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                        return;
                    }

                    if (checkIfSearchResultIsPlaylist(searchResult)) {
                        let playlistDuration = searchResult.tracks.reduce(
                            (acc, track) => acc + track.duration,
                            0,
                        );

                        await guildPlayer.queue.add(searchResult.tracks);

                        if (!guildPlayer.playing || guildPlayer.paused) {
                            await guildPlayer.play({ paused: false });
                        }

                        let emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(
                                `${client.emojiList.tick} | **Added *${searchResult.tracks.length}* songs from the playlist *${searchResult.playlistInfo.name}* to the queue.**`,
                            )
                            .addFields([
                                {
                                    name: "Playlist Duration",
                                    value: `\`${convertMillisecondsToTime(playlistDuration)}\``,
                                    inline: true,
                                },
                                {
                                    name: "Tracks Added",
                                    value: `\`${searchResult.tracks.length}\``,
                                    inline: true,
                                },
                                {
                                    name: "Requester",
                                    value: `${message.member}`,
                                    inline: true,
                                },
                            ])
                            .setTimestamp();

                        let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                        if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                    } else {
                        let track = searchResult.tracks[0];

                        await guildPlayer.queue.add(track);

                        if (!guildPlayer.playing || guildPlayer.paused) {
                            await guildPlayer.play({ paused: false });
                        }

                        let emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(
                                `${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to the queue.**`,
                            )
                            .addFields([
                                {
                                    name: "Duration",
                                    value: `\`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\``,
                                    inline: true,
                                },
                                {
                                    name: "Requester",
                                    value: `${message.member}`,
                                    inline: true,
                                },
                            ])
                            .setTimestamp();

                        if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

                        let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                        if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                    }

                    if (setupData.messageId) {
                        let setupView = buildSetupView(client, guildPlayer);
                        let setupMessage =
                            textChannel.messages.cache.get(setupData.messageId) ||
                            (await textChannel.messages.fetch(setupData.messageId).catch(() => null));

                        if (setupMessage) {
                            await setupMessage.edit(setupView).catch(() => null);
                        }
                    }
                } catch (err) {
                    (client.logger || require("../../utils/logger")).error("[SETUP_SYSTEM] Error processing setup request:", err);

                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **An error occurred while trying to \`play\` the song.**`,
                        );

                    let m = await textChannel.send({ embeds: [emb] }).catch(() => null);
                    if (m) setTimeout(() => m.delete().catch(() => null), 5000);
                }
            }
        }
    },
};
