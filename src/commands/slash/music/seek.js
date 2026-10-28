const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");
const {
    parseTime, convertMillisecondsToTime, createProgressBar
} = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek to a specific position in the current song.")
        .addStringOption((opt) =>
            opt.setName("time").setDescription("Time to seek to (e.g. 1:30, +30s, -20s)").setRequired(false)
        ),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const track = guildPlayer.current;
        const currentPos = guildPlayer.position ?? track.position ?? 0;
        const timeInput = interaction.options.getString("time");

        if (!timeInput) {
            const prog = createProgressBar(currentPos, track.duration);
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `**Current playback position in *[${track.title}](${track.uri})*:**\n\n` +
                    `${prog.bar} \`${convertMillisecondsToTime(currentPos)} / ${convertMillisecondsToTime(track.duration)}\``
                );
            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);
            return await interaction.editReply({ embeds: [emb] });
        }

        if (!track.isSeekable || track.isStream) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **The current track is not seekable.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            let targetMs = parseTime(timeInput);
            if (timeInput.startsWith("+")) targetMs = currentPos + targetMs;
            if (timeInput.startsWith("-")) targetMs = Math.max(0, currentPos - targetMs);

            if (isNaN(targetMs) || targetMs < 0 || targetMs > track.duration) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **Please provide a valid timestamp within \`0:00\` and \`${convertMillisecondsToTime(track.duration)}\`.**`);
                return await interaction.editReply({ embeds: [emb] });
            }

            await guildPlayer.seek(targetMs);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Seeked to \`${convertMillisecondsToTime(targetMs)}\` in *[${track.title}](${track.uri})*.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while seeking.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
