const {
    EmbedBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SlashCommandBuilder,
} = require("discord.js");
const {
    convertMillisecondsToTime, createProgressBar
} = require("../../../utils/musicUtils/index.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Show the currently playing music."),
    player: {
        active: true,
        playing: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);

        try {
            const track = guildPlayer.current;
            const pos = guildPlayer.position ?? track.position ?? 0;
            const dur = track.duration;
            const progBar = createProgressBar(pos, dur);

            const nowPlayingContainer = new ContainerBuilder()
                .setAccentColor(client?.color?.number ?? 0xFF66C4);

            const mainSection = new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${client.emojiList.nowplaying} | Now Playing\n`),
                new TextDisplayBuilder().setContent(
                    `### [${track.title}](${track.uri}) - Requested By: ${track.requester || "Unknown"}\n\n` +
                    `${progBar.bar} \`${convertMillisecondsToTime(pos)} / ${convertMillisecondsToTime(dur)}\`\n\n`
                )
            );

            if (track.artworkUrl) {
                mainSection.setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(track.artworkUrl)
                        .setDescription(`Artwork for ${track.title ?? "N/A"}`)
                );
            }

            nowPlayingContainer.addSectionComponents(mainSection);

            return await interaction.editReply({
                components: [nowPlayingContainer],
            });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while displaying the current track.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
