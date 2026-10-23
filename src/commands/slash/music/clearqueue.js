const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("clearqueue")
        .setDescription("Clear all upcoming tracks from the queue."),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);

        if (guildPlayer.queue.tracks.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **There are no tracks in the queue to clear.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            await guildPlayer.queue.clear();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **The queue has been successfully cleared.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`clear\` the queue.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
