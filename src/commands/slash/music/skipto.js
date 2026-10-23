const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("skipto")
        .setDescription("Skip to a specific song in the queue.")
        .addIntegerOption((opt) =>
            opt.setName("position").setDescription("Queue position to skip to (1-based)").setRequired(true).setMinValue(1)
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
        const num = interaction.options.getInteger("position");

        if (num > guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a valid queue position between 1 and ${guildPlayer.queue.tracks.length}.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            const track = guildPlayer.queue.tracks[num - 1];
            await guildPlayer.skip(num - 1);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Skipped to [${track.title}](${track.uri}).**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to skip to that song.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
