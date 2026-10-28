const {
    EmbedBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
    SlashCommandBuilder,
} = require("discord.js");
const {
    convertMillisecondsToTime
} = require("../../../utils/musicUtils/index.js");

const accentColor = 0xFF66C4;
const lyricsPerPage = 12;
const maxPageLength = 3000;
const collectorTimeout = 120_000;

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("Shows lyrics for the currently playing music or a searched song.")
        .addStringOption((opt) =>
            opt.setName("song").setDescription("Song title to search lyrics for").setRequired(false)
        ),
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const songQuery = interaction.options.getString("song")?.trim();

        let track;
        let lyricsClient = guildPlayer?.lyricsClient || client.musicManager.lyricsClient;

        if (songQuery) {
            let searchResult;
            try {
                searchResult = await client.musicManager.search({
                    query: songQuery,
                    requester: interaction.user,
                });
            } catch (err) {
                console.error(err);
            }
            track = searchResult?.tracks?.[0];
            if (!track) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **I couldn't find a track matching \`${songQuery}\`.**`);
                return await interaction.editReply({ embeds: [emb] });
            }
        } else {
            track = guildPlayer?.current;
            if (!track) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **No music is playing and no song name was provided.**`);
                return await interaction.editReply({ embeds: [emb] });
            }
        }

        let lyricsData;
        try {
            lyricsData = await lyricsClient?.getLyrics(track);
        } catch {
            lyricsData = null;
        }

        if (!lyricsData || (!lyricsData.lyrics && !lyricsData.lines?.length)) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **No lyrics found for *[${track.title}](${track.uri})*.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        const lines = lyricsData.lines?.length
            ? lyricsData.lines.map((l) => l.line || l.text || l)
            : (lyricsData.lyrics || "").split("\n");

        const totalPages = Math.max(1, Math.ceil(lines.length / lyricsPerPage));
        let currentPage = 0;

        const buildEmbed = (page) => {
            const start = page * lyricsPerPage;
            const slice = lines.slice(start, start + lyricsPerPage);
            return new EmbedBuilder()
                .setColor(accentColor)
                .setTitle(`Lyrics: ${track.title}`)
                .setURL(track.uri)
                .setDescription(slice.join("\n") || "No lyrics available.")
                .setFooter({ text: `Page ${page + 1} of ${totalPages} | Requested by ${interaction.user.tag}` })
                .setTimestamp();
        };

        const buildRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("lyr_prev").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId("lyr_next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1)
            );
        };

        const reply = await interaction.editReply({
            embeds: [buildEmbed(currentPage)],
            components: totalPages > 1 ? [buildRow(currentPage)] : [],
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: collectorTimeout,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You cannot control this menu.", ephemeral: true });
            }
            if (i.customId === "lyr_prev") currentPage = Math.max(0, currentPage - 1);
            if (i.customId === "lyr_next") currentPage = Math.min(totalPages - 1, currentPage + 1);

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
