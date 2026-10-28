const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("nightcore")
        .setDescription("Toggle the high-tempo Nightcore audio filter.")
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

        const isCurrentlyActive = Boolean(guildPlayer.filters.isActive("nightcore"));
        let targetState;
        if (stateInput === "on") targetState = true;
        else if (stateInput === "off") targetState = false;
        else targetState = !isCurrentlyActive;

        try {
            if (targetState) {
                await guildPlayer.filters.add("nightcore");
            } else {
                await guildPlayer.filters.remove("nightcore");
            }

            const emb = new EmbedBuilder()
                .setColor(targetState ? (client?.color?.hex ?? "#FF66C4") : "Red")
                .setDescription(
                    `${targetState ? client.emojiList.tick : client.emojiList.cross} | **Nightcore has been \`${targetState ? "enabled" : "disabled"}\`.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while toggling the Nightcore filter.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
