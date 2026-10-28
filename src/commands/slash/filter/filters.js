const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} = require("discord.js");

const accentColor = 0xFF66C4;
const collectorTime = 90_000;

function formatFilterName(filterName) {
    if (!filterName) return "";
    if (filterName.toLowerCase() === "8d") return "8D";
    return filterName
        .replace(/[-_]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function getActiveFilters(player) {
    if (!player?.filters) return [];
    if (player.filters.active instanceof Set) return Array.from(player.filters.active);
    if (Array.isArray(player.filters.enabled)) return [...player.filters.enabled];
    if (Array.isArray(player.filters.active)) return [...player.filters.active];
    if (typeof player.filters.active === "string") return [player.filters.active];
    return [];
}

function buildFilterView(availableFilters, selectedFilters, appliedFilters, statusText = null, disabled = false, client) {
    const container = new ContainerBuilder().setAccentColor(accentColor);

    const titleText = `## ${client.emojiList.filters} | Audio Equalizers & DSP Filters\n`;
    const subtitleText = "Toggle desired filters using the buttons below, then click **Apply Filters** to commit changes.\n";

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(titleText),
        new TextDisplayBuilder().setContent(subtitleText)
    );

    const appliedDisplay = appliedFilters.length
        ? appliedFilters.map((f) => `\`${formatFilterName(f)}\``).join(", ")
        : "\`None (Default)\`";

    const stagedDisplay = selectedFilters.size
        ? Array.from(selectedFilters).map((f) => `\`${formatFilterName(f)}\``).join(", ")
        : "\`None\`";

    const statusLines = [
        `**Currently Active:** ${appliedDisplay}`,
        `**Staged Selection:** ${stagedDisplay}`,
    ];
    if (statusText) statusLines.push(`\n${statusText}`);

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusLines.join("\n")));
    container.addSeparatorComponents(new SeparatorBuilder());

    const rows = [];
    const chunkSize = 5;
    for (let i = 0; i < availableFilters.length; i += chunkSize) {
        if (rows.length >= 4) break;
        const slice = availableFilters.slice(i, i + chunkSize);
        const row = new ActionRowBuilder();
        for (const f of slice) {
            const isChosen = selectedFilters.has(f);
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`filter_toggle_${f}`)
                    .setLabel(formatFilterName(f))
                    .setStyle(isChosen ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(disabled)
            );
        }
        rows.push(row);
    }

    const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("filter_clear").setLabel("Clear All").setStyle(ButtonStyle.Danger).setDisabled(disabled),
        new ButtonBuilder().setCustomId("filter_apply").setLabel("Apply Filters").setStyle(ButtonStyle.Primary).setEmoji(client.emojiList.tick).setDisabled(disabled)
    );
    rows.push(controlRow);

    return { components: [container, ...rows] };
}

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("filters")
        .setDescription("Configure and toggle audio equalizers and DSP filters with interactive UI."),
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

        const availableFilters = Array.isArray(guildPlayer.filters?.available)
            ? [...guildPlayer.filters.available]
            : ["8d", "bassboost-low", "bassboost-medium", "bassboost-high", "chipmunk", "darthvader", "daycore", "doubletime", "earrape", "karaoke", "nightcore", "pop", "soft", "treblebass", "vaporwave"];

        const activeNow = getActiveFilters(guildPlayer);
        const selectedFilters = new Set(activeNow);

        const initialPayload = buildFilterView(availableFilters, selectedFilters, activeNow, null, false, client);
        const reply = await interaction.editReply(initialPayload);

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: collectorTime,
        });

        collector.on("collect", async (btnInt) => {
            if (btnInt.user.id !== interaction.user.id) {
                return btnInt.reply({ content: "You cannot control this menu.", ephemeral: true });
            }

            const customId = btnInt.customId;

            if (customId === "filter_clear") {
                selectedFilters.clear();
                try {
                    await guildPlayer.filters.clear();
                    const updated = buildFilterView(availableFilters, selectedFilters, [], "All audio filters have been cleared.", false, client);
                    return await btnInt.update(updated);
                } catch (e) {
                    return btnInt.reply({ content: "Failed to clear filters.", ephemeral: true });
                }
            }

            if (customId === "filter_apply") {
                try {
                    const toApply = Array.from(selectedFilters);
                    await guildPlayer.filters.set(toApply);
                    const applied = getActiveFilters(guildPlayer);
                    const updated = buildFilterView(availableFilters, selectedFilters, applied, "Filters committed and applied successfully!", false, client);
                    return await btnInt.update(updated);
                } catch (e) {
                    return btnInt.reply({ content: "Failed to apply filters.", ephemeral: true });
                }
            }

            if (customId.startsWith("filter_toggle_")) {
                const target = customId.replace("filter_toggle_", "");
                if (selectedFilters.has(target)) selectedFilters.delete(target);
                else selectedFilters.add(target);

                const currentApplied = getActiveFilters(guildPlayer);
                const updated = buildFilterView(availableFilters, selectedFilters, currentApplied, null, false, client);
                return await btnInt.update(updated);
            }
        });

        collector.on("end", async () => {
            const currentApplied = getActiveFilters(guildPlayer);
            const disabledPayload = buildFilterView(availableFilters, selectedFilters, currentApplied, "Filter selector has expired.", true, client);
            await interaction.editReply(disabledPayload).catch(() => null);
        });
    },
};
