const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    MessageFlags,
    EmbedBuilder,
} = require("discord.js");

const ACCENT_COLOR = 0xFF66C4;
const COLLECTOR_TIME = 90_000;
const COLLECTOR_IDLE = 45_000;

/**
 * Formats a raw filter string so that the first letter of each word is capitalized.
 * E.g. "bassboost-low" -> "Bassboost Low", "8d" -> "8D", "nightcore" -> "Nightcore".
 *
 * @param {string} filterName
 * @returns {string}
 */
function formatFilterName(filterName) {
    if (!filterName) return "";
    if (filterName.toLowerCase() === "8d") return "8D";

    return filterName
        .replace(/[-_]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Retrieves the currently active filters on the player as a string array.
 *
 * @param {import("../../../structures/reverbPlayer.js")} player
 * @returns {string[]}
 */
function getActiveFilters(player) {
    if (!player?.filters) return [];

    if (player.filters.active instanceof Set) {
        return Array.from(player.filters.active);
    }

    if (Array.isArray(player.filters.enabled)) {
        return [...player.filters.enabled];
    }

    if (Array.isArray(player.filters.active)) {
        return [...player.filters.active];
    }

    if (typeof player.filters.active === "string") {
        return [player.filters.active];
    }

    return [];
}

/**
 * Constructs the Components V2 Container for the audio filters interface.
 *
 * @param {object} params
 * @param {import("../../../structures/client.js")} params.client
 * @param {string[]} params.availableFilters
 * @param {Set<string>} params.selectedFilters
 * @param {string[]} params.appliedFilters
 * @param {string|null} [params.statusText]
 * @param {boolean} [params.disabled]
 * @returns {ContainerBuilder}
 */
function buildFiltersContainer({
    client,
    availableFilters,
    selectedFilters,
    appliedFilters,
    statusText = null,
    disabled = false,
}) {
    const accentColor = client?.color?.number ?? ACCENT_COLOR;
    const container = new ContainerBuilder()
        .setAccentColor(accentColor);

    // 1. Header Display
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${client.emojiList.filters} Audio Equalizer & Filters\n` +
            `-# Click filter buttons to choose your desired audio effects, then click **Apply Filters**.`,
        ),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    // 2. Status & Details Display
    const appliedDisplay = appliedFilters.length
        ? appliedFilters.map((f) => `\`${formatFilterName(f)}\``).join(", ")
        : "`None (Default)`";

    const stagedDisplay = selectedFilters.size
        ? Array.from(selectedFilters).map((f) => `\`${formatFilterName(f)}\``).join(", ")
        : "`None`";

    const statusLines = [
        `**Currently Active:** ${appliedDisplay}`,
        `**Staged Selection:** ${stagedDisplay}`,
    ];

    if (statusText) {
        statusLines.push(`\n${statusText}`);
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(statusLines.join("\n")),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    // 3. Action Rows for Filter Buttons (up to 5 buttons per row, reserving row 5 for controls)
    const rows = [];
    const chunkSize = 5;

    for (let i = 0; i < availableFilters.length; i += chunkSize) {
        if (rows.length >= 4) break;

        const slice = availableFilters.slice(i, i + chunkSize);
        const row = new ActionRowBuilder();

        for (const filter of slice) {
            const isChosen = selectedFilters.has(filter);
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`filter_toggle_${filter}`)
                    .setLabel(formatFilterName(filter))
                    .setStyle(isChosen ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(disabled),
            );
        }

        rows.push(row);
    }

    // 4. Control Action Row: Clear All & Apply
    const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("filter_clear")
            .setLabel("Clear All")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId("filter_apply")
            .setLabel("Apply Filters")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(client.emojiList.tick)
            .setDisabled(disabled),
    );

    rows.push(controlRow);

    container.addActionRowComponents(...rows);

    return container;
}

module.exports = {
    name: "filters",
    description: "Configure and toggle audio equalizers and filters.",
    usage: "[filter name | clear]",
    category: "filter",
    aliases: ["filter", "eq", "equalizer"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(message.guildId);

        const availableFilters = Array.isArray(guildPlayer.filters?.available)
            ? [...guildPlayer.filters.available]
            : [];

        if (availableFilters.length === 0) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **No audio filters are available on the current audio node.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Fast path: quick command usage via text arguments (e.g. `r!filters clear` or `r!filters nightcore`)
        const directArg = args[0]?.toLowerCase();
        if (directArg === "clear" || directArg === "reset" || directArg === "off") {
            guildPlayer.filters.clear();
            await guildPlayer.filters.apply();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.number ?? ACCENT_COLOR)
                .setDescription(
                    `${client.emojiList.tick} | **Successfully cleared all audio filters from the player.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        if (directArg && availableFilters.includes(directArg)) {
            const isCurrentlyActive = guildPlayer.filters.isActive(directArg);
            if (isCurrentlyActive) {
                guildPlayer.filters.disable(directArg);
            } else {
                guildPlayer.filters.enable(directArg);
            }
            await guildPlayer.filters.apply();

            const stateText = isCurrentlyActive ? "disabled" : "enabled";
            const emb = new EmbedBuilder()
                .setColor(client?.color?.number ?? ACCENT_COLOR)
                .setDescription(
                    `${client.emojiList.tick} | **Successfully ${stateText} filter \`${formatFilterName(directArg)}\` on the player.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Interactive Components V2 Interface
        let appliedFilters = getActiveFilters(guildPlayer);
        const selectedFilters = new Set(appliedFilters);

        const initialContainer = buildFiltersContainer({
            client,
            availableFilters,
            selectedFilters,
            appliedFilters,
        });

        const filterMessage = await message.reply({
            components: [initialContainer],
            flags: MessageFlags.IsComponentsV2,
        });

        const collector = filterMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: COLLECTOR_TIME,
            idle: COLLECTOR_IDLE,
        });

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: `${client.emojiList.cross} | Only ${message.author} can interact with these filter controls.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            const currentPlayer = await client.musicManager.players.get(message.guildId);
            if (!currentPlayer || !currentPlayer.connected || !currentPlayer.current) {
                collector.stop("player_ended");
                return interaction.reply({
                    content: `${client.emojiList.cross} | The music player is no longer active in this server.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            const currentUserVoice = interaction.member?.voice;
            const currentUserVoiceId = currentUserVoice?.channelId || currentUserVoice?.channel?.id;
            if (!currentUserVoice?.channel || currentPlayer.voiceChannelId !== currentUserVoiceId) {
                return interaction.reply({
                    content: `${client.emojiList.cross} | You must be in the same voice channel as the bot to control filters.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            try {
                if (interaction.customId.startsWith("filter_toggle_")) {
                    const filterName = interaction.customId.replace("filter_toggle_", "");

                    if (selectedFilters.has(filterName)) {
                        selectedFilters.delete(filterName);
                    } else {
                        selectedFilters.add(filterName);
                    }

                    const updatedContainer = buildFiltersContainer({
                        client,
                        availableFilters,
                        selectedFilters,
                        appliedFilters,
                    });

                    await interaction.update({
                        components: [updatedContainer],
                    });
                } else if (interaction.customId === "filter_clear") {
                    selectedFilters.clear();

                    const updatedContainer = buildFiltersContainer({
                        client,
                        availableFilters,
                        selectedFilters,
                        appliedFilters,
                        statusText: `${client.emojiList.note} | *Staged selection cleared. Click "Apply Filters" to commit changes.*`,
                    });

                    await interaction.update({
                        components: [updatedContainer],
                    });
                } else if (interaction.customId === "filter_apply") {
                    if (selectedFilters.size === 0) {
                        currentPlayer.filters.clear();
                        await currentPlayer.filters.apply();
                    } else {
                        currentPlayer.filters.clear();
                        for (const name of selectedFilters) {
                            currentPlayer.filters.enable(name);
                        }
                        await currentPlayer.filters.apply();
                    }

                    appliedFilters = getActiveFilters(currentPlayer);

                    const appliedNames = appliedFilters.length
                        ? appliedFilters.map(formatFilterName).join(", ")
                        : "None (Default)";

                    const statusText = appliedFilters.length
                        ? `${client.emojiList.tick} | **Successfully applied filter(s):** \`${appliedNames}\``
                        : `${client.emojiList.tick} | **Successfully cleared all audio filters from the player!**`;

                    const updatedContainer = buildFiltersContainer({
                        client,
                        availableFilters,
                        selectedFilters,
                        appliedFilters,
                        statusText,
                    });

                    await interaction.update({
                        components: [updatedContainer],
                    });
                }

                collector.resetTimer();
            } catch (err) {
                console.error("Error processing filter interaction:", err);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `${client.emojiList.cross} | An error occurred while updating filters: ${err.message}`,
                        flags: MessageFlags.Ephemeral,
                    }).catch(() => null);
                } else {
                    await interaction.followUp({
                        content: `${client.emojiList.cross} | An error occurred while updating filters: ${err.message}`,
                        flags: MessageFlags.Ephemeral,
                    }).catch(() => null);
                }
            }
        });

        collector.on("end", async () => {
            const timeoutContainer = buildFiltersContainer({
                client,
                availableFilters,
                selectedFilters,
                appliedFilters,
                statusText: `*Menu timed out. Use \`${prefix}filters\` to open it again.*`,
                disabled: true,
            });

            await filterMessage.edit({
                components: [timeoutContainer],
            }).catch(() => null);
        });

        return filterMessage;
    },
};
