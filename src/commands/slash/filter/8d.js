const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("8d")
        .setDescription("Toggle the 8D rotating surround audio filter.")
        .addStringOption((opt) =>
            opt
                .setName("state")
                .setDescription("Toggle state")
                .setRequired(false)
                .addChoices(
                    { name: "On", value: "on" },
                    { name: "Off", value: "off" }
                )
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
        const stateInput = interaction.options.getString("state");

        const isCurrentlyActive = Boolean(guildPlayer.filters.isActive("8d"));
        let targetState;
        if (stateInput === "on") targetState = true;
        else if (stateInput === "off") targetState = false;
        else targetState = !isCurrentlyActive;

        try {
            if (targetState) {
                await guildPlayer.filters.add("8d");
            } else {
                await guildPlayer.filters.remove("8d");
            }

            const emb = new EmbedBuilder()
                .setColor(targetState ? (client?.color?.hex ?? "#FF66C4") : "Red")
                .setDescription(
                    `${targetState ? client.emojiList.tick : client.emojiList.cross} | **8D Audio has been \`${targetState ? "enabled" : "disabled"}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while toggling the 8D Audio filter.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
