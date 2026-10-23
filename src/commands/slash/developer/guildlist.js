const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    SlashCommandBuilder,
} = require("discord.js");

const GUILDS_PER_PAGE = 10;
const COLLECTOR_TIME = 60_000;

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("guildlist")
        .setDescription("Browse the list of servers the bot is currently in."),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const guilds = Array.from(client.guilds.cache.values()).sort(
            (a, b) => b.memberCount - a.memberCount
        );

        const totalPages = Math.max(1, Math.ceil(guilds.length / GUILDS_PER_PAGE));
        let currentPage = 0;

        const buildEmbed = (page) => {
            const start = page * GUILDS_PER_PAGE;
            const slice = guilds.slice(start, start + GUILDS_PER_PAGE);

            const lines = slice.map((g, idx) => {
                const num = start + idx + 1;
                return `**${num}.** \`${g.name}\` (ID: \`${g.id}\`) - \`${g.memberCount}\` members`;
            });

            return new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setTitle(`Joined Servers (${guilds.length})`)
                .setDescription(lines.join("\n") || "No servers found.")
                .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
                .setTimestamp();
        };

        const buildRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("gl_prev")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId("gl_next")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1)
            );
        };

        const reply = await interaction.editReply({
            embeds: [buildEmbed(currentPage)],
            components: totalPages > 1 ? [buildRow(currentPage)] : [],
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: COLLECTOR_TIME,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You cannot control this menu.", ephemeral: true });
            }

            if (i.customId === "gl_prev") currentPage = Math.max(0, currentPage - 1);
            if (i.customId === "gl_next") currentPage = Math.min(totalPages - 1, currentPage + 1);

            await i.update({
                embeds: [buildEmbed(currentPage)],
                components: [buildRow(currentPage)],
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [] }).catch(() => null);
        });
    },
};
