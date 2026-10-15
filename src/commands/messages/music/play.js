const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "play",
    description: "Play a song in your voice channel.",
    usage: "<song name or URL>",
    category: "music",
    aliases: ["j"],
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.getPlayer(message.guildId);

        if (!args.length) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | Please provide a song name or URL. Usage: \`${prefix}play <song name or URL>\``,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        if (!message.member.voice.channel) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in a voice channel to use this command.`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        if (guildPlayer && guildPlayer.connected && guildPlayer.voiceChannelId !== message.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.queue.channel}. Please join that channel to listen.`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        let voiceChannelToJoin = message.member.voice.channel;

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.createPlayer({
                    guildId: message.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: message.channelId,
                    selfDeaf: true,
                    selfMute: false,
                    volume: client.config.music.defaultVolume,
                    vcRegion: voiceChannelToJoin.rtcRegion || null,
                });

                if (!guildPlayer.connected) await guildPlayer.connect();
            }

            let songQuery = args.join(" ");

            let searchResult = await guildPlayer.search({
                query: `spsearch:${songQuery}`, // Use Spotify search
            }, message.author);

            if (!searchResult || !searchResult.tracks.length) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            }

            if (searchResult.playlist) {
                let msg = await message.reply({
                    content: `${client.emojiList.loading} | Adding **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
                });

                if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.`,
                        )
                        .addFields([
                            {
                                name: "Alternative Sources",
                                value:
                                    "You can use sources like Spotify, SoundCloud, or other supported platforms to play music.",
                                inline: false,
                            },
                        ]);

                    return msg.edit({
                        content: null,
                        embeds: [emb],
                    });
                }

                await guildPlayer.queue.add(searchResult.tracks);

                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | Added **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
                    )
                    .addFields([
                        {
                            name: "Playlist Duration",
                            value: `\`[ ${searchResult.playlist.durationFormatted} ]\``,
                            inline: true,
                        },
                        {
                            name: "Tracks Added",
                            value: `\`[ ${searchResult.tracks.length} ]\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${message.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (searchResult.playlist.thumbnail) {
                    emb.setThumbnail(searchResult.playlist.thumbnail);
                }

                return msg.edit({
                    content: null,
                    embeds: [emb]
                });
            } else {
                let track = searchResult.tracks[0];

                if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.`,
                        )
                        .addFields([
                            {
                                name: "Alternative Sources",
                                value:
                                    "You can use sources like Spotify, SoundCloud, or other supported platforms to play music.",
                                inline: false,
                            },
                        ]);

                    return message.reply({
                        embeds: [emb],
                    });
                }

                await guildPlayer.queue.add(track);
                
                if (!guildPlayer.playing || !guildPlayer.paused) await guildPlayer.play({ paused: false });

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | Added **${track.info.title}** to the queue.`,
                    )
                    .addFields([
                        {
                            name: "Duration",
                            value: `\`[ ${track.info.duration} ]\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${message.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (track.info.artworkUrl) {
                    emb.setThumbnail(track.info.artworkUrl);
                }

                return message.reply({
                    embeds: [emb]
                });
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | An error occurred while trying to play the song.`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    }
};

function checkIfSearchResultIsPlaylist(searchResult) {
    if (searchResult.loadType === "playlist") return true;
    return false;
}

function checkIfURIIsYoutubeBased(url) {
    return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi.test(url);
}