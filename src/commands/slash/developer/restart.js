const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Safely disconnect all audio sessions and reboot the bot process."),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const activeSessions = client.musicManager?.players?.size ?? 0;
        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.tick} | **Rebooting process...** Safely disconnecting \`${activeSessions}\` audio session(s).`
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        try {
            if (client.musicManager?.players) {
                for (const player of client.musicManager.players.values()) {
                    await player.destroy("Bot process restarting.").catch(() => null);
                }
            }
            await client.database?.disconnect?.().catch(() => null);
        } catch (e) {
            console.error("Error during pre-restart cleanup:", e);
        }

        process.exit(0);
    },
};
