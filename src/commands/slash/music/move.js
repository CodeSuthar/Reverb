const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("move")
        .setDescription("Move a song to a different position in the queue.")
        .addIntegerOption((opt) =>
            opt.setName("from").setDescription("Current position of the song (1-based)").setRequired(true).setMinValue(1)
        )
        .addIntegerOption((opt) =>
            opt.setName("to").setDescription("New position for the song (1-based)").setRequired(true).setMinValue(1)
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

        if (!guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **There are no songs in the queue to move.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        const from = interaction.options.getInteger("from");
        const to = interaction.options.getInteger("to");
        const queueLength = guildPlayer.queue.tracks.length;

        if (from > queueLength || to > queueLength) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Positions cannot exceed the total queue length of \`${queueLength}\` tracks.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        if (from === to) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **The source and target positions cannot be the same.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            const [movedTrack] = guildPlayer.queue.tracks.splice(from - 1, 1);
            guildPlayer.queue.tracks.splice(to - 1, 0, movedTrack);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully moved *[${movedTrack.title}](${movedTrack.uri})* from position \`${from}\` to \`${to}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while moving the track.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
