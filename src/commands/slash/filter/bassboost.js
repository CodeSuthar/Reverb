const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

const BASS_LEVELS = ["bassboost-low", "bassboost-medium", "bassboost-high"];

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("bassboost")
        .setDescription("Adjust the bass boost audio filter level.")
        .addStringOption((opt) =>
            opt
                .setName("level")
                .setDescription("Bass boost level")
                .setRequired(false)
                .addChoices(
                    { name: "Low", value: "low" },
                    { name: "Medium", value: "medium" },
                    { name: "High", value: "high" },
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
        const levelInput = interaction.options.getString("level");

        let currentLevel = "off";
        if (guildPlayer.filters.isActive("bassboost-high")) currentLevel = "high";
        else if (guildPlayer.filters.isActive("bassboost-medium")) currentLevel = "medium";
        else if (guildPlayer.filters.isActive("bassboost-low")) currentLevel = "low";

        let targetLevel = "off";
        if (levelInput) {
            targetLevel = levelInput;
        } else {
            if (currentLevel === "off") targetLevel = "low";
            else if (currentLevel === "low") targetLevel = "medium";
            else if (currentLevel === "medium") targetLevel = "high";
            else targetLevel = "off";
        }

        try {
            for (const filter of BASS_LEVELS) {
                if (guildPlayer.filters.isActive(filter)) {
                    await guildPlayer.filters.remove(filter);
                }
            }

            if (targetLevel !== "off") {
                await guildPlayer.filters.add(`bassboost-${targetLevel}`);
            }

            const isEnabled = targetLevel !== "off";
            const emb = new EmbedBuilder()
                .setColor(isEnabled ? (client?.color?.hex ?? "#FF66C4") : "Red")
                .setDescription(
                    `${isEnabled ? client.emojiList.tick : client.emojiList.cross} | **Bass Boost has been ${isEnabled ? `set to \`${targetLevel.toUpperCase()}\`` : "\`disabled\""}.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while adjusting bass boost.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
