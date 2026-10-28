const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Change the volume of the player in the voice channel.")
        .addIntegerOption((opt) =>
            opt.setName("level").setDescription("Volume level (0 to 150)").setRequired(false).setMinValue(0).setMaxValue(150)
        ),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const volume = interaction.options.getInteger("level");

        if (volume === null) {
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.volume.default} | **The current volume level is set to \`${guildPlayer.volume}\`.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        const currentVolume = guildPlayer.volume;
        if (currentVolume === volume) {
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.volume.default} | **The volume is already set to \`${volume}\`.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            await guildPlayer.setVolume(volume);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${currentVolume < volume ? client.emojiList.volume.up : client.emojiList.volume.down} | **Successfully ${currentVolume < volume ? "increased" : "decreased"} the volume to \`${volume}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to change the volume.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
