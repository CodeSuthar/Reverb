const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Make the bot leave your voice channel."),
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
            await guildPlayer.destroy("User requested to leave the voice channel.");

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.leave} | **Successfully \`left\` the voice channel.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`leave\` the voice channel.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
