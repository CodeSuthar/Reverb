const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song in your voice channel.")
        .addStringOption((option) => option
            .setName("song")
            .setDescription("The name or URL of the song to play.")
            .setRequired(true)
            .setAutocomplete(true)
        ),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = await client.player.guildPlayer(interaction.guildId);

        if (!interaction.member.voice.channel) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in a voice channel to use this command.`,
                );

            return await interaction.editReply({
                embeds: [emb],
            });
        }

        if (guildPlayer && guildPlayer.queue && guildPlayer.queue.channel.id !== interaction.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.queue.channel}. Please join that channel to listen.`,
                );
            
            return await interaction.editReply({
                embeds: [emb]
            });
        }

        let voiceChannelToJoin = interaction.member.voice.channel;

        try {
            if (!guildPlayer || !guildPlayer.queue.connection) {
                await client.player.manager.nodes.create(interaction.guildId, {
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000, // 5 minutes
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000, // 5 minutes
                    leaveOnStop: true,
                    leaveOnStopCooldown: 600000, // 10 minutes
                    selfDeaf: true,
                    volume: 100,
                    bufferingTimeout: 200,
                    metadata: {
                        textChannel: interaction.channelId,
                        playingMessage: null,
                    }
                }).connect(voiceChannelToJoin.id);

                guildPlayer = await client.player.guildPlayer(interaction.guildId);
            }

            let songQuery = interaction.options.getString("song");

            let searchResult = await client.player.manager.search(songQuery, {
                requestedBy: message.author
            });

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
                await interaction.editReply({
                    content: `${client.emojiList.loading} | Adding **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
                });
            
                if ((checkIfSearchQueryIsUrl(songQuery) && checkIfSearchResultIsYoutubeBased(songQuery) && !client.config.music.playYoutube) || (checkIfSearchResultIsYoutubeBased(searchResult.playlist.url) && !client.config.music.playYoutube) ) {
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

                    return interaction.editReply({
                        content: null,
                        embeds: [emb],
                    });
                }
            
                for (const track of searchResult.tracks) {
                    let songs = await client.ytMusic.search(`${track.title} by ${track.author}`);

                    if (songs.length > 0) {
                        let song = songs[0];

                        let songUrl = `https://www.youtube.com/watch?v=${song.videoId}`;

                        let searchResult = await client.player.manager.search(songUrl, {
                            requestedBy: interaction.user
                        });

                        if (searchResult && searchResult.tracks.length > 0) {
                            await guildPlayer.queue.addTrack(searchResult.tracks[0]);
                        }
                }

            
                if (!guildPlayer.isPlaying() || guildPlayer.isPaused()) {
                    await guildPlayer.play();
                }
            
            
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
                            name: "Playlist Tracks Count",
                            value: `\`[ ${searchResult.playlist.tracks.length} ]\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${message.member}`,
                            inline: true,
                        },
                    ])
                    .setThumbnail(searchResult.playlist.thumbnail)
                    .setTimestamp();

                return interaction.editReply({
                    content: null,
                    embeds: [emb],
                });
            } else {
                let track = searchResult.tracks[0];
            
                if (checkIfSearchQueryIsUrl(songQuery) && checkIfSearchResultIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
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
                            await guildPlayer.queue.addTrack(track);
            
                            if (!guildPlayer.isPlaying() || guildPlayer.isPaused()) {
                                await guildPlayer.play();
                            }
            
                            let emb = new EmbedBuilder()
                                .setColor("#FF66C4")
                                .setDescription(
                                    `${client.emojiList.tick} | Added **${track.title}** to the queue.`,
                                )
                                .addFields([
                                    {
                                        name: "Duration",
                                        value: `\`[ ${track.duration} ]\``,
                                        inline: true,
                                    },
                                    {
                                        name: "Requester",
                                        value: `${message.member}`,
                                        inline: true,
                                    },
                                ])
                                .setThumbnail(track.thumbnail)
                                .setTimestamp();
            
                            return message.reply({
                                embeds: [emb],
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
                    `${client.emojiList.cross} | An error occurred while trying to join your voice channel.`,
                );
            
            return await interaction.editReply({
                embeds: [emb],
            });
        }
    }
    // run: async (message, args, client, prefix) => {
    //     let guildPlayer = await client.player.guildPlayer(message.guildId);

    //     console.log(guildPlayer);

    //     if (!message.member.voice.channel) {
    //         let emb = new EmbedBuilder()
    //             .setColor("Red")
    //             .setDescription(
    //                 `${client.emojiList.cross} | You need to be in a voice channel to use this command.`,
    //             );

    //         return message.reply({
    //             embeds: [emb],
    //         });
    //     }

    //     if (
    //         guildPlayer &&
    //         guildPlayer.queue &&
    //         guildPlayer.queue.channel.id !== message.member.voice.channelId
    //     ) {
    //         let emb = new EmbedBuilder()
    //             .setColor("Red")
    //             .setDescription(
    //                 `${client.emojiList.cross} | I am already playing music in ${guildPlayer.queue.channel}. Please join that channel to listen.`,
    //             );

    //         return message.reply({
    //             embeds: [emb],
    //         });
    //     }

    //     let voiceChannelToJoin = message.member.voice.channel;

    //     try {
    //         if (!guildPlayer || !guildPlayer.queue.connection) {
    //             await client.player.manager.nodes.create(
    //                 message.guildId,
    //                 {
    //                     leaveOnEmpty: true,
    //                     leaveOnEmptyCooldown: 300000, // 5 minutes
    //                     leaveOnEnd: true,
    //                     leaveOnEndCooldown: 300000, // 5 minutes
    //                     leaveOnStop: true,
    //                     leaveOnStopCooldown: 600000, // 10 minutes
    //                     selfDeaf: true,
    //                     volume: 100,
    //                     bufferingTimeout: 200,
    //                     metadata: {
    //                         textChannel: message.channelId,
    //                         playingMessage: null,
    //                     }
    //                 }
    //             ).connect(voiceChannelToJoin.id);

    //             guildPlayer = await client.player.guildPlayer(message.guildId);
    //         }

    //         let songQuery = checkIfSearchQueryIsUrl(args.join(" ")) ? args.join(" ") : `${args.join(" ")} official audio`;

    //         let searchResult = await client.player.manager.search(songQuery, {
    //             searchEngine: "spotifySearch",
    //             requestedBy: message.author
    //         });

    //         if (!searchResult || !searchResult.tracks.length) {
    //             let emb = new EmbedBuilder()
    //                 .setColor("Red")
    //                 .setDescription(
    //                     `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
    //                 );

    //             return message.reply({
    //                 embeds: [emb],
    //             });
    //         }

    //         if (searchResult.playlist) {
    //             let msg = await message.reply({
    //                 content: `${client.emojiList.loading} | Adding **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
    //             });

    //             if (
    //                 (checkIfSearchQueryIsUrl(songQuery) &&
    //                     checkIfSearchResultIsYoutubeBased(songQuery) &&
    //                     !client.config.music.playYoutube) ||
    //                 (checkIfSearchResultIsYoutubeBased(searchResult.playlist.url) &&
    //                     !client.config.music.playYoutube)
    //             ) {
    //                 let emb = new EmbedBuilder()
    //                     .setColor("Red")
    //                     .setDescription(
    //                         `${client.emojiList.cross} | Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.`,
    //                     )
    //                     .addFields([
    //                         {
    //                             name: "Alternative Sources",
    //                             value:
    //                                 "You can use sources like Spotify, SoundCloud, or other supported platforms to play music.",
    //                             inline: false,
    //                         },
    //                     ]);

    //                 return msg.edit({
    //                     content: null,
    //                     embeds: [emb],
    //                 });
    //             }

    //             await guildPlayer.queue.addTrack(searchResult.tracks);

    //             if (!guildPlayer.isPlaying() || guildPlayer.isPaused()) {
    //                 await guildPlayer.play();
    //             }


    //             let emb = new EmbedBuilder()
    //                 .setColor("#FF66C4")
    //                 .setDescription(
    //                     `${client.emojiList.tick} | Added **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
    //                 )
    //                 .addFields([
    //                     {
    //                         name: "Playlist Duration",
    //                         value: `\`[ ${searchResult.playlist.durationFormatted} ]\``,
    //                         inline: true,
    //                     },
    //                     {   
    //                         name: "Playlist Tracks Count",
    //                         value: `\`[ ${searchResult.playlist.tracks.length} ]\``,
    //                         inline: true,
    //                     },
    //                     {
    //                         name: "Requester",
    //                         value: `${message.member}`,
    //                         inline: true,
    //                     },
    //                 ])
    //                 .setThumbnail(searchResult.playlist.thumbnail)
    //                 .setTimestamp();

    //             return msg.edit({
    //                 content: null,
    //                 embeds: [emb],
    //             });
    //         } else {
    //             let track = searchResult.tracks[0];

    //             if (checkIfSearchQueryIsUrl(songQuery) && checkIfSearchResultIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
    //                 let emb = new EmbedBuilder()
    //                     .setColor("Red")
    //                     .setDescription(
    //                         `${client.emojiList.cross} | Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.`,
    //                     )
    //                     .addFields([
    //                         {
    //                             name: "Alternative Sources",
    //                             value:
    //                                 "You can use sources like Spotify, SoundCloud, or other supported platforms to play music.",
    //                             inline: false,
    //                         },
    //                     ]);

    //                 return message.reply({
    //                     embeds: [emb],
    //                 });
    //             }
    //             await guildPlayer.queue.addTrack(track);

    //             if (!guildPlayer.isPlaying() || guildPlayer.isPaused()) {
    //                 await guildPlayer.play();
    //             }

    //             let emb = new EmbedBuilder()
    //                 .setColor("#FF66C4")
    //                 .setDescription(
    //                     `${client.emojiList.tick} | Added **${track.title}** to the queue.`,
    //                 )
    //                 .addFields([
    //                     {
    //                         name: "Duration",
    //                         value: `\`[ ${track.duration} ]\``,
    //                         inline: true,
    //                     },
    //                     {
    //                         name: "Requester",
    //                         value: `${message.member}`,
    //                         inline: true,
    //                     },
    //                 ])
    //                 .setThumbnail(track.thumbnail)
    //                 .setTimestamp();

    //             return message.reply({
    //                 embeds: [emb],
    //             });
    //         }
    //     } catch (err) {
    //         console.dir(err, { depth: null });

    //         if (err.errors) {
    //             console.dir(err.errors, { depth: null });
    //         }

    //         let emb = new EmbedBuilder()
    //             .setColor("Red")
    //             .setDescription(
    //                 `${client.emojiList.cross} | An error occurred while trying to play the song.`,
    //             );

    //         return message.reply({
    //             embeds: [emb],
    //         });
    //     }
    // }
};

function checkIfSearchQueryIsUrl(query) {
    try {
        new URL(query);
        return true;
    } catch (err) {
        return false;
    }
}

function checkIfSearchResultIsYoutubeBased(url) {
    return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi.test(
        url,
    );
}
