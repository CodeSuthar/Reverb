const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { checkIfURIIsYoutubeBased, checkIfSearchResultIsPlaylist, convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song in your voice channel.")
        .addStringOption((opt) =>
            opt.setName("song").setDescription("The song name or URL to play").setRequired(true)
        ),
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        let guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const voiceChannelToJoin = interaction.member.voice.channel;
        const songQuery = interaction.options.getString("song");

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.players.create({
                    guildId: interaction.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: interaction.channelId,
                });
                if (!guildPlayer.connected) await guildPlayer.connect();
            }

            if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.**`
                    );
                return await interaction.editReply({ embeds: [emb] });
            }

            const searchResult = await client.musicManager.search({
                query: songQuery,
                requester: interaction.user,
            });

            if (!searchResult || !searchResult.tracks.length) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | No results found for \`${songQuery}\`.`);
                return await interaction.editReply({ embeds: [emb] });
            }

            if (checkIfSearchResultIsPlaylist(searchResult)) {
                const playlistDuration = searchResult.tracks.reduce((acc, track) => acc + track.duration, 0);
                await guildPlayer.queue.add(searchResult.tracks);

                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | **Added *${searchResult.tracks.length}* songs from the playlist *${searchResult.playlistInfo.name}* to the queue.**`
                    )
                    .addFields([
                        { name: "Playlist Duration", value: `\`${convertMillisecondsToTime(playlistDuration)}\``, inline: true },
                        { name: "Tracks Added", value: `\`${searchResult.tracks.length}\``, inline: true },
                        { name: "Requester", value: `${interaction.member}`, inline: true },
                    ])
                    .setTimestamp();

                return await interaction.editReply({ embeds: [emb] });
            } else {
                const track = searchResult.tracks[0];
                await guildPlayer.queue.add(track);

                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to the queue.**`
                    )
                    .addFields([
                        { name: "Duration", value: `\`${track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown")}\``, inline: true },
                        { name: "Position In Queue", value: `\`${guildPlayer.queue.tracks.length}\``, inline: true },
                        { name: "Requester", value: `${interaction.member}`, inline: true },
                    ])
                    .setTimestamp();

                if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

                return await interaction.editReply({ embeds: [emb] });
            }
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to play that song.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
