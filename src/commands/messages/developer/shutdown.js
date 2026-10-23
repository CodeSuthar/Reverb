const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

module.exports = {
    name: "shutdown",
    description: "Completely shut down the bot process.",
    usage: "",
    category: "developer",
    developerOnly: true,
    aliases: ["turnoff", "stopbot", "kill"],
    run: async (message, args, client, prefix) => {
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const confirmButton = new ButtonBuilder()
            .setCustomId("confirm_shutdown")
            .setLabel("Shut Down")
            .setEmoji(client.emojiList.stop)
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel_shutdown")
            .setLabel("Cancel")
            .setEmoji(client.emojiList.cross)
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const confirmEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${client.emojiList.stop} Shutdown Confirmation`)
            .setDescription(
                `Are you sure you want to completely shut down **${botName}**?\n` +
                `The bot process will terminate and will require manual hosting restart.`,
            )
            .setFooter({
                text: "This confirmation will expire in 30 seconds.",
            })
            .setTimestamp();

        const replyMessage = await message.reply({
            embeds: [confirmEmbed],
            components: [row],
        });

        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30_000,
            filter: (interaction) => interaction.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
            try {
                await interaction.deferUpdate();

                if (interaction.customId === "cancel_shutdown") {
                    collector.stop("cancelled");

                    const cancelEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **Shutdown process was cancelled.**`,
                        );

                    return replyMessage.edit({
                        embeds: [cancelEmbed],
                        components: [],
                    });
                }

                if (interaction.customId === "confirm_shutdown") {
                    collector.stop("confirmed");

                    const shutdownEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.tick} | **\`${botName}\` has been safely shut down. System offline.**`,
                        );

                    await replyMessage.edit({
                        embeds: [shutdownEmbed],
                        components: [],
                    });

                    // Gracefully disconnect client
                    await client.destroy();

                    // Terminate the process
                    process.exit(0);
                }
            } catch (err) {
                console.error("Error during shutdown:", err);
                const errorEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Failed to shut down the process:** ${err.message || err}`,
                    );

                return replyMessage.edit({
                    embeds: [errorEmbed],
                    components: [],
                }).catch(() => null);
            }
        });

        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.timeout} | **Shutdown confirmation timed out.**`,
                    );

                await replyMessage.edit({
                    embeds: [timeoutEmbed],
                    components: [],
                }).catch(() => null);
            }
        });
    },
};
