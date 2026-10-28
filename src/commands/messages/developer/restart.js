const {
    spawn
} = require("child_process");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

module.exports = {
    name: "restart",
    description: "Restart the bot process cleanly.",
    usage: "",
    category: "developer",
    developerOnly: true,
    aliases: ["reboot", "botrestart"],
    run: async (message, args, client, prefix) => {
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const confirmButton = new ButtonBuilder()
            .setCustomId("confirm_restart")
            .setLabel("Confirm Restart")
            .setEmoji(client.emojiList.tick)
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel_restart")
            .setLabel("Cancel")
            .setEmoji(client.emojiList.cross)
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const confirmEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${client.emojiList.loading} Restart Confirmation`)
            .setDescription(
                `Are you sure you want to restart **${botName}**?\n` +
                `Active voice connections, players, and playing queues will be disrupted during the restart.`,
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

                if (interaction.customId === "cancel_restart") {
                    collector.stop("cancelled");

                    const cancelEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **Restart process was cancelled.**`,
                        );

                    return replyMessage.edit({
                        embeds: [cancelEmbed],
                        components: [],
                    });
                }

                if (interaction.customId === "confirm_restart") {
                    collector.stop("confirmed");

                    const restartingEmbed = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `${client.emojiList.loading} | **Restarting \`${botName}\`... Process will respawn shortly.**`,
                        );

                    await replyMessage.edit({
                        embeds: [restartingEmbed],
                        components: [],
                    });

                    // Gracefully disconnect client
                    await client.destroy();

                    // Respawn the bot process
                    const child = spawn(process.argv[0], process.argv.slice(1), {
                        detached: true,
                        stdio: "inherit",
                        cwd: process.cwd(),
                        env: process.env,
                    });

                    child.unref();
                    process.exit(0);
                }
            } catch (err) {
                console.error("Error during restart:", err);
                const errorEmbed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Failed to restart the process:** ${err.message || err}`,
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
                        `${client.emojiList.timeout} | **Restart confirmation timed out.**`,
                    );

                await replyMessage.edit({
                    embeds: [timeoutEmbed],
                    components: [],
                }).catch(() => null);
            }
        });
    },
};
