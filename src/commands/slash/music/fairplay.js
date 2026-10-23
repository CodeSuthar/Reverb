const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("fairplay")
        .setDescription("Toggle FairPlay mode for the music queue."),
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
            const isFairPlay = await guildPlayer.getData("fairplay");
            const newFairPlay = !isFairPlay;

            await guildPlayer.setData("fairplay", newFairPlay);
            await guildPlayer.setFairPlay();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **FairPlay mode has been successfully \`${newFairPlay ? "enabled" : "disabled"}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to toggle \`fairplay\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
