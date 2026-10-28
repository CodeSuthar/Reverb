const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");

const itemsPerPage = 10;
const collectorTimeout = 120_000;

module.exports = {
    name: "guildlist",
    description: "List all Discord servers the bot is currently in.",
    usage: "",
    category: "developer",
    developerOnly: true,
    aliases: ["glst", "guilds", "servers", "serverlist"],
    run: async (message, args, client, prefix) => {
        let allGuilds = [];

        if (client.shard) {
            try {
                const results = await client.shard.broadcastEval((c) =>
                    c.guilds.cache.map((g) => ({
                        id: g.id,
                        name: g.name,
                        memberCount: g.memberCount || 0,
                    })),
                );
                allGuilds = results.flat();
            } catch {
                allGuilds = client.guilds.cache.map((g) => ({
                    id: g.id,
                    name: g.name,
                    memberCount: g.memberCount || 0,
                }));
            }
        } else {
            allGuilds = client.guilds.cache.map((g) => ({
                id: g.id,
                name: g.name,
                memberCount: g.memberCount || 0,
            }));
        }

        if (allGuilds.length === 0) {
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.note} | **The bot is not currently connected to any servers.**`,
                );

            return message.reply({ embeds: [emb] });
        }

        // Sort guilds descending by member count
        allGuilds.sort((a, b) => b.memberCount - a.memberCount);

        const totalGuilds = allGuilds.length;
        const totalMembers = allGuilds.reduce((acc, g) => acc + g.memberCount, 0);
        const maxPages = Math.ceil(totalGuilds / itemsPerPage);
        let currentPage = 0;

        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const buildPageEmbed = (page) => {
            const start = page * itemsPerPage;
            const currentSlice = allGuilds.slice(start, start + itemsPerPage);

            const lines = currentSlice.map((g, index) => {
                const absoluteIndex = start + index + 1;
                return `\`${absoluteIndex}.\` **${g.name}**\n↳ ID: \`${g.id}\` • Members: \`${g.memberCount.toLocaleString()}\``;
            });

            return new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setAuthor({
                    name: `${botName} Server List`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(lines.join("\n\n"))
                .setFooter({
                    text: `Page ${page + 1} of ${maxPages} • Total Servers: ${totalGuilds} • Total Members: ${totalMembers.toLocaleString()}`,
                })
                .setTimestamp();
        };

        const buildActionRow = (page, disabled = false) => {
            const prevButton = new ButtonBuilder()
                .setCustomId("guildlist_prev")
                .setEmoji(client.emojiList.buttons.previous)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || page === 0);

            const nextButton = new ButtonBuilder()
                .setCustomId("guildlist_next")
                .setEmoji(client.emojiList.buttons.next)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || page === maxPages - 1);

            const closeButton = new ButtonBuilder()
                .setCustomId("guildlist_close")
                .setEmoji(client.emojiList.buttons.close)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled);

            return new ActionRowBuilder().addComponents(prevButton, nextButton, closeButton);
        };

        const initialEmbed = buildPageEmbed(currentPage);
        const initialRow = buildActionRow(currentPage);

        const replyMessage = await message.reply({
            embeds: [initialEmbed],
            components: maxPages > 1 ? [initialRow] : [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("guildlist_close")
                    .setEmoji(client.emojiList.buttons.close)
                    .setStyle(ButtonStyle.Secondary),
            )],
        });

        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: collectorTimeout,
            filter: (interaction) => interaction.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
            try {
                if (interaction.customId === "guildlist_prev") {
                    currentPage = Math.max(0, currentPage - 1);
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [buildActionRow(currentPage)],
                    });
                } else if (interaction.customId === "guildlist_next") {
                    currentPage = Math.min(maxPages - 1, currentPage + 1);
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [buildActionRow(currentPage)],
                    });
                } else if (interaction.customId === "guildlist_close") {
                    collector.stop("closed");
                    await interaction.update({
                        embeds: [buildPageEmbed(currentPage)],
                        components: [],
                    }).catch(() => null);
                }
            } catch (err) {
                console.error("Error in guildlist pagination:", err);
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
