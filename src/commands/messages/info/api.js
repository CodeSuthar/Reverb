const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const NODES_PER_PAGE = 2;
const COLLECTOR_TIMEOUT = 120_000;

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(ms) {
    if (!ms || isNaN(ms)) return "0s";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
}

module.exports = {
    name: "api",
    description: "Display connection and telemetry statistics for all audio nodes.",
    usage: "",
    category: "info",
    aliases: ["lavalink", "node", "nodes", "ll", "nodestats"],
    run: async (message, args, client, prefix) => {
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
        const nodeManager = client.musicManager?.nodes;

        // Retrieve nodes Map from Moonlink NodeManager
        const nodesMap = nodeManager?.nodes;
        const allNodes = nodesMap && typeof nodesMap.values === "function"
            ? Array.from(nodesMap.values())
            : [];

        if (allNodes.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: `${botName} Audio Engine`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(`${client.emojiList.cross} | **No audio nodes are currently configured or connected.**`)
                .setTimestamp();

            return message.reply({ embeds: [emptyEmbed] });
        }

        const maxPages = Math.ceil(allNodes.length / NODES_PER_PAGE);
        let currentPage = 0;

        const buildPageEmbed = (page) => {
            const start = page * NODES_PER_PAGE;
            const currentNodes = allNodes.slice(start, start + NODES_PER_PAGE);

            const embed = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: `${botName} - Audio Nodes`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true }),
                })
                .setFooter({
                    text: `Page ${page + 1} of ${maxPages} • Total Nodes: ${allNodes.length}`,
                })
                .setTimestamp();

            for (const node of currentNodes) {
                const isOnline = Boolean(node.connected);
                const statusSymbol = isOnline ? "Online" : "Offline";
                const latency = node.latency >= 0 ? `${node.latency}ms` : (isOnline ? "Active" : "Disconnected");

                const nodeInfo = [
                    `Status:        ${statusSymbol}`,
                    `Address:       ${node.host}:${node.port}`,
                    `WebSocket:     ${latency}`
                ].join("\n");

                embed.addFields([
                    {
                        name: `${node.identifier || `${node.host}:${node.port}`}`,
                        value: `\`\`\`yaml\n${nodeInfo}\n\`\`\``,
                        inline: false,
                    },
                ]);
            }

            return embed;
        };

        const buildActionRow = (page, disabled = false) => {
            const prevButton = new ButtonBuilder()
                .setCustomId("api_prev")
                .setEmoji(client.emojiList.buttons.previous)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || page === 0);

            const nextButton = new ButtonBuilder()
                .setCustomId("api_next")
                .setEmoji(client.emojiList.buttons.next)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || page === maxPages - 1);

            const closeButton = new ButtonBuilder()
                .setCustomId("api_close")
                .setEmoji(client.emojiList.buttons.close)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled);

            return new ActionRowBuilder().addComponents(prevButton, nextButton, closeButton);
        };

        const initialEmbed = buildPageEmbed(currentPage);

        if (maxPages === 1) {
            return message.reply({ embeds: [initialEmbed] });
        }

        const replyMessage = await message.reply({
            embeds: [initialEmbed],
            components: [buildActionRow(currentPage)],
        });

        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: COLLECTOR_TIMEOUT,
            filter: (interaction) => interaction.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
            try {
                if (interaction.customId === "api_prev") {
                    currentPage = Math.max(0, currentPage - 1);
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [buildActionRow(currentPage)],
                    });
                } else if (interaction.customId === "api_next") {
                    currentPage = Math.min(maxPages - 1, currentPage + 1);
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [buildActionRow(currentPage)],
                    });
                } else if (interaction.customId === "api_close") {
                    collector.stop("closed");
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [],
                    }).catch(() => null);
                }
            } catch (err) {
                console.error("Error in api pagination:", err);
            }
        });

        collector.on("end", async (_, reason) => {
            if (reason !== "closed") {
                const disabledRow = buildActionRow(currentPage, true);
                await replyMessage.edit({
                    components: [disabledRow],
                }).catch(() => null);
            }
        });
    },
};
