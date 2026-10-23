const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffle the songs in the queue."),
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

        if (!guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **There are no songs in the queue to shuffle.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        if (guildPlayer.getData?.("fairplay")) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **The queue cannot be shuffled while FairPlay is enabled.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            await guildPlayer.queue.shuffle();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(`${client.emojiList.tick} | **Successfully \`shuffled\` the queue.**`);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to shuffle the queue.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
