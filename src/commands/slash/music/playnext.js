const {
    EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits
} = require("discord.js");
const {
    checkIfURIIsYoutubeBased, checkIfSearchResultIsPlaylist, convertMillisecondsToTime
} = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("playnext")
        .setDescription("Play a song next in the queue.")
        .addStringOption((opt) =>
            opt.setName("song").setDescription("The song name or URL to play next").setRequired(true)
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
        if (guildPlayer) {
            const isFairPlay = (await guildPlayer.getData?.("fairplay")) || guildPlayer.get?.("fairplay");
            if (isFairPlay) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Songs cannot be inserted into the front of the queue while FairPlay is enabled. Please use the \`/play\` command to add tracks fairly.**`
                    );
                return await interaction.editReply({ embeds: [emb] });
            }
        }

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
                    .setDescription(`${client.emojiList.cross} | **Unable to play music from YouTube at this time.**`);
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

            const track = searchResult.tracks[0];
            await guildPlayer.queue.unshift(track);

            if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to be played next.**`
                )
                .addFields([
                    { name: "Duration", value: `\`${track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown")}\``, inline: true },
                    { name: "Position", value: "`Next Track`", inline: true },
                    { name: "Requester", value: `${interaction.member}`, inline: true },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while queueing the song next.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
