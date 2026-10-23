const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    SlashCommandBuilder,
} = require("discord.js");
const { convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

const TRACKS_PER_PAGE = 5;
const COLLECTOR_TIMEOUT = 120_000;

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("View the current music queue."),
    player: {
        active: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);

        if (!guildPlayer.current && !guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **There is no music playing or queued in this server.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        const currentTrack = guildPlayer.current;
        const queuedTracks = [...guildPlayer.queue.tracks];
        const totalDuration = queuedTracks.reduce((total, t) => total + (Number(t.duration) || 0), 0);
        const totalPages = Math.max(1, Math.ceil(queuedTracks.length / TRACKS_PER_PAGE));
        let currentPage = 0;

        const buildEmbed = (page) => {
            const start = page * TRACKS_PER_PAGE;
            const slice = queuedTracks.slice(start, start + TRACKS_PER_PAGE);

            const lines = slice.map((t, idx) => {
                const pos = start + idx + 1;
                const dur = t.duration ? convertMillisecondsToTime(t.duration) : "Live";
                return `**${pos}.** [${t.title}](${t.uri}) - \`${dur}\` | ${t.requester || "Unknown"}`;
            });

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setTitle(`Current Queue (${queuedTracks.length} tracks)`)
                .setDescription(
                    (currentTrack ? `**Now Playing:** [${currentTrack.title}](${currentTrack.uri})\n\n` : "") +
                    (lines.length ? lines.join("\n\n") : "*No upcoming tracks in queue.*")
                )
                .setFooter({
                    text: `Page ${page + 1} of ${totalPages} | Total Queue Duration: ${convertMillisecondsToTime(totalDuration)}`,
                })
                .setTimestamp();

            return emb;
        };

        const buildRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("q_prev").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId("q_next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1)
            );
        };

        const reply = await interaction.editReply({
            embeds: [buildEmbed(currentPage)],
            components: totalPages > 1 ? [buildRow(currentPage)] : [],
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: COLLECTOR_TIMEOUT,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You cannot control this menu.", ephemeral: true });
            }
            if (i.customId === "q_prev") currentPage = Math.max(0, currentPage - 1);
            if (i.customId === "q_next") currentPage = Math.min(totalPages - 1, currentPage + 1);

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
