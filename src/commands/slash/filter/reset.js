const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("reset")
        .setDescription("Reset all audio filters and equalizers back to default."),
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

        try {
            await guildPlayer.filters.clear();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(`${client.emojiList.tick} | **Successfully reset all audio filters to default.**`);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while resetting audio filters.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
