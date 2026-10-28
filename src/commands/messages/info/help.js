const {
    MessageFlags
} = require("discord.js");
const {
    CATEGORY_ORDER,
    shouldDisplayDeveloper,
    buildHelpView,
    buildCommandDetailView,
} = require("../../../utils/buildHelpView");

const collectorTime = 90_000;
const collectorIdle = 45_000;

module.exports = {
    name: "help",
    description: "Browse all commands with the interactive Components V2 Help Desk or view specific command info.",
    usage: "[command | subcommand]",
    category: "info",
    aliases: ["h", "commands", "menu"],
    run: async (message, args, client, prefix) => {
        const isDeveloper = Boolean(client.developerIds?.includes(message.author.id));

        // 1. Specific Command or Subcommand Detail View
        if (args.length > 0) {
            const query = args.join(" ").trim();
            const detailView = buildCommandDetailView({ client, query, prefix, isDeveloper });

            const replyMessage = await message.reply(detailView);

            // Handle "Back to Help Menu" button interaction if clicked
            const backCollector = replyMessage.createMessageComponentCollector({
                time: collectorTime,
                idle: collectorIdle,
            });

            backCollector.on("collect", async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: `${client.emojiList.cross} | Only ${message.author} can interact with this help view.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (interaction.customId === "help_nav_home") {
                    backCollector.stop("nav_home");
                    // Switch to main overview
                    const homeView = buildHelpView({ client, category: "home", prefix, isDeveloper });
                    await interaction.update(homeView);
                    setupMainCollector(replyMessage, message.author.id, client, prefix, isDeveloper);
                } else if (!backCollector.ended) {
                    backCollector.resetTimer();
                }
            });

            return;
        }

        // 2. Interactive Components V2 Help Desk
        let currentCategory = "home";
        const initialView = buildHelpView({
            client,
            category: currentCategory,
            prefix,
            isDeveloper,
        });

        const helpMessage = await message.reply(initialView);
        setupMainCollector(helpMessage, message.author.id, client, prefix, isDeveloper);
    },
};

/**
 * Sets up the main interactive collector for the Components V2 Help Desk.
 */
function setupMainCollector(msg, authorId, client, prefix, isDeveloper) {
    let currentCategory = "home";
    const canShowDev = shouldDisplayDeveloper({ client, isDeveloper });
    const availableCategories = CATEGORY_ORDER.filter(
        (c) => c !== "developer" || canShowDev,
    );

    const collector = msg.createMessageComponentCollector({
        time: collectorTime,
        idle: collectorIdle,
    });

    collector.on("collect", async (interaction) => {
        if (interaction.user.id !== authorId) {
            return interaction.reply({
                content: `${client.emojiList.cross} | Only <@${authorId}> can interact with this help menu.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            // Select Menu Interaction
            if (interaction.isStringSelectMenu() && interaction.customId === "help_menu_select") {
                const selected = interaction.values[0];
                if (availableCategories.includes(selected)) {
                    currentCategory = selected;
                }
            } else if (interaction.isButton()) {
                const btnId = interaction.customId;

                if (btnId === "help_nav_home") {
                    currentCategory = "home";
                } else if (btnId === "help_nav_prev") {
                    const currentIndex = availableCategories.indexOf(currentCategory);
                    const prevIndex = Math.max(0, currentIndex - 1);
                    currentCategory = availableCategories[prevIndex];
                } else if (btnId === "help_nav_next") {
                    const currentIndex = availableCategories.indexOf(currentCategory);
                    const nextIndex = Math.min(availableCategories.length - 1, currentIndex + 1);
                    currentCategory = availableCategories[nextIndex];
                } else if (btnId === "help_nav_close") {
                    collector.stop("closed");
                    const disabledView = buildHelpView({
                        client,
                        category: currentCategory,
                        prefix,
                        isDeveloper,
                        disabled: true,
                    });
                    await interaction.update(disabledView).catch(() => null);
                    return;
                }
            }

            const updatedView = buildHelpView({
                client,
                category: currentCategory,
                prefix,
                isDeveloper,
            });

            await interaction.update(updatedView);

            // Reset timer on every interaction
            if (!collector.ended) {
                collector.resetTimer();
            }
        } catch (err) {
            client.logger?.warn("[HELP] Error processing component interaction:", err);
        }
    });

    collector.on("end", async (_, reason) => {
        if (reason === "closed") return;
        try {
            const disabledView = buildHelpView({
                client,
                category: currentCategory,
                prefix,
                isDeveloper,
                disabled: true,
            });

            await msg.edit(disabledView).catch(() => null);
        } catch (_) {}
    });
}
