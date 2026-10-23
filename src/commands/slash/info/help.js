const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const {
    CATEGORY_ORDER,
    shouldDisplayDeveloper,
    buildHelpView,
    buildCommandDetailView,
    getHelpAutocompleteChoices,
} = require("../../../utils/buildHelpView");

const COLLECTOR_TIME = 90_000;
const COLLECTOR_IDLE = 45_000;

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Browse all commands and features with the interactive Components V2 Help Desk.")
        .addStringOption((opt) =>
            opt
                .setName("command")
                .setDescription("Specific command or subcommand to view detailed information for.")
                .setRequired(false)
                .setAutocomplete(true),
        ),
    async autocomplete(client, interaction) {
        // Handle argument polymorphism depending on caller signature
        const actualInteraction = interaction?.isAutocomplete?.() ? interaction : client;
        const actualClient = actualInteraction?.client || client;

        const focusedValue = actualInteraction.options?.getFocused?.() || "";
        const isDeveloper = Boolean(actualClient.developerIds?.includes(actualInteraction.user?.id));
        const choices = getHelpAutocompleteChoices(actualClient, focusedValue, isDeveloper);

        await actualInteraction.respond(choices).catch(() => null);
    },
    run: async (client, interaction) => {
        await interaction.deferReply();

        const isDeveloper = Boolean(client.developerIds?.includes(interaction.user.id));
        let prefix = client.config?.bot?.prefix || client.prefix || "r!";
        if (client.database && interaction.guildId) {
            try {
                const custom = await client.database.getPrefix(interaction.guildId);
                if (custom) prefix = custom;
            } catch {
                // fallback to default
            }
        }
        const cmdQuery = interaction.options.getString("command");

        // 1. Specific Command or Subcommand Detail View
        if (cmdQuery) {
            const detailView = buildCommandDetailView({ client, query: cmdQuery, prefix, isDeveloper });
            const replyMessage = await interaction.editReply(detailView);

            // Handle "Back to Help Menu" button interaction if clicked
            const backCollector = replyMessage.createMessageComponentCollector({
                time: COLLECTOR_TIME,
                idle: COLLECTOR_IDLE,
            });

            backCollector.on("collect", async (int) => {
                if (int.user.id !== interaction.user.id) {
                    return int.reply({
                        content: `${client.emojiList.cross} | Only <@${interaction.user.id}> can interact with this view.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                if (int.customId === "help_nav_home") {
                    backCollector.stop("nav_home");
                    const homeView = buildHelpView({ client, category: "home", prefix, isDeveloper });
                    await int.update(homeView);
                    setupSlashMainCollector(replyMessage, interaction, client, prefix, isDeveloper);
                } else if (!backCollector.ended) {
                    backCollector.resetTimer();
                }
            });

            return;
        }

        // 2. Main Interactive Components V2 Help Desk
        let currentCategory = "home";
        const initialView = buildHelpView({
            client,
            category: currentCategory,
            prefix,
            isDeveloper,
        });

        const replyMessage = await interaction.editReply(initialView);
        setupSlashMainCollector(replyMessage, interaction, client, prefix, isDeveloper);
    },
};

/**
 * Sets up the main interactive collector for the Slash Command Components V2 Help Desk.
 */
function setupSlashMainCollector(replyMessage, originalInteraction, client, prefix, isDeveloper) {
    let currentCategory = "home";
    const canShowDev = shouldDisplayDeveloper({ client, isDeveloper });
    const availableCategories = CATEGORY_ORDER.filter(
        (c) => c !== "developer" || canShowDev,
    );

    const collector = replyMessage.createMessageComponentCollector({
        time: COLLECTOR_TIME,
        idle: COLLECTOR_IDLE,
    });

    collector.on("collect", async (int) => {
        if (int.user.id !== originalInteraction.user.id) {
            return int.reply({
                content: `${client.emojiList.cross} | Only <@${originalInteraction.user.id}> can interact with this help menu.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            // Select Menu Interaction
            if (int.isStringSelectMenu() && int.customId === "help_menu_select") {
                const selected = int.values[0];
                if (availableCategories.includes(selected)) {
                    currentCategory = selected;
                }
            } else if (int.isButton()) {
                const btnId = int.customId;

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
                    await int.update(disabledView).catch(() => null);
                    return;
                }
            }

            const updatedView = buildHelpView({
                client,
                category: currentCategory,
                prefix,
                isDeveloper,
            });

            await int.update(updatedView);

            // Reset timer on every interaction
            if (!collector.ended) {
                collector.resetTimer();
            }
        } catch (err) {
            client.logger?.warn("[HELP_SLASH] Error processing component interaction:", err);
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

            await originalInteraction.editReply(disabledView).catch(() => null);
        } catch (_) {}
    });
}
