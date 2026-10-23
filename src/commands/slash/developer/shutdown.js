const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("shutdown")
        .setDescription("Gracefully disconnect the bot and terminate the process completely."),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`${client.emojiList.cross} | **Shutting down...** Goodbye!`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            if (client.musicManager?.players) {
                for (const player of client.musicManager.players.values()) {
                    await player.destroy("Bot shutting down.").catch(() => null);
                }
            }
            await client.destroy();
            await client.database?.disconnect?.().catch(() => null);
        } catch (e) {
            console.error("Error during pre-shutdown cleanup:", e);
        }

        process.exit(0);
    },
};
