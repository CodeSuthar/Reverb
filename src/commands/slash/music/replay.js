const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");
const {
    convertMillisecondsToTime
} = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("replay")
        .setDescription("Replay the current song from the beginning."),
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

        if (!guildPlayer.current.isSeekable || guildPlayer.current.isStream) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The current song cannot be replayed from the beginning because it is not seekable.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            await guildPlayer.seek(0);
            const track = guildPlayer.current;

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Replaying *[${track.title}](${track.uri})* from the beginning.**`
                )
                .addFields([
                    { name: "Duration", value: `\`${track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown")}\``, inline: true },
                    { name: "Requester", value: `${track.requester || interaction.member}`, inline: true },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to replay the song.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
