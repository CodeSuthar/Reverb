const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("Toggle autoplay for the music player."),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);

        try {
            const isAutoplay = guildPlayer.autoPlay;
            await guildPlayer.setAutoPlay(!isAutoplay);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Autoplay has been successfully \`${!isAutoplay ? "enabled" : "disabled"}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to toggle \`autoplay\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
