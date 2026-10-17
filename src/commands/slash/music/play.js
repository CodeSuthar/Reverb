const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { checkIfURIIsYoutubeBased, checkIfSearchResultIsPlaylist, convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song in your voice channel.")
        .addStringOption((option) =>
            option
                .setName("song")
                .setDescription("The name or URL of the song to play.")
                .setRequired(true)
        ),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = await client.musicManager.getPlayer(interaction.guildId);

        let songQuery = interaction.options.getString("song");

        if (!songQuery) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | Please provide a song name or URL. Usage: \`/play <song name or URL>\``,
                );

            return await interaction.editReply({
                embeds: [emb],
            });
        }

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

        if (guildPlayer && guildPlayer.connected && guildPlayer.voiceChannelId !== interaction.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.voiceChannel || guildPlayer.queue.channel}. Please join that channel to listen.`,
                );

            return await interaction.editReply({
                embeds: [emb],
            });
        }

        let voiceChannelToJoin = interaction.member.voice.channel;

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.createPlayer({
                    guildId: interaction.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: interaction.channelId,
                    selfDeaf: true,
                    selfMute: false,
                    volume: client.config.music.defaultVolume,
                    vcRegion: voiceChannelToJoin.rtcRegion || null,
                });

                if (!guildPlayer.connected) await guildPlayer.connect();
            }

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

                return await interaction.editReply({
                    embeds: [emb],
                });
            }

            let searchResult = await guildPlayer.customReverbSearch(songQuery, interaction.user);

            if (!searchResult || !searchResult.tracks.length) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
                    );

                return await interaction.editReply({
                    embeds: [emb],
                });
            }

            if (checkIfSearchResultIsPlaylist(searchResult)) {
                await interaction.editReply({
                    content: `${client.emojiList.loading} | Adding **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlist.title}\` to the queue.`,
                });

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
                            value: `\`[ ${convertMillisecondsToTime(searchResult.playlist.duration)} ]\``,
                            inline: true,
                        },
                        {
                            name: "Tracks Added",
                            value: `\`[ ${searchResult.tracks.length} ]\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${interaction.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (searchResult.playlist.thumbnail) {
                    emb.setThumbnail(searchResult.playlist.thumbnail);
                }

                return await interaction.editReply({
                    content: null,
                    embeds: [emb]
                });
            } else {
                let track = searchResult.tracks[0];

                await guildPlayer.queue.add(track);
                
                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                let trackTitle = track.metadata?.title ? `[${track.metadata.title}](${track.metadata.uri})` : `**${track.info.title}**`;

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | Added ${trackTitle} to the queue.`,
                    )
                    .addFields([
                        {
                            name: "Duration",
                            value: `\`[ ${convertMillisecondsToTime(track.info.duration)} ]\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${interaction.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (track.metadata?.artworkUrl) emb.setThumbnail(track.metadata?.artworkUrl);

                return await interaction.editReply({
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

            return await interaction.editReply({
                embeds: [emb],
            });
        }
    }
};
