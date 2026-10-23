const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} = require("discord.js");
const { convertMillisecondsToTime } = require("../../../utils/musicUtils");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("grab")
        .setDescription("Send the currently playing track to your DMs."),
    player: {
        active: true,
        playing: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const track = guildPlayer.current;

        try {
            const container = new ContainerBuilder()
                .setAccentColor(client?.color?.number ?? 0xFF66C4);

            const newSection = new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## [${track.title}](${track.uri})\n` +
                    `**Artist:** ${track.author || "Unknown"}\n` +
                    `**Duration:** ${track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown Duration")}\n` +
                    `**Requested by:** ${track.requester?.tag || track.requester?.username || "Unknown"}`
                )
            );

            if (track.uri) {
                newSection.setButtonAccessory(
                    new ButtonBuilder()
                        .setLabel("Listen to the Track")
                        .setStyle(ButtonStyle.Link)
                        .setURL(track.uri)
                );
            }

            container.addSectionComponents(newSection);

            await interaction.user.send({ components: [container] });

            return await interaction.editReply({
                content: `${client.emojiList.tick} | **Check your Direct Messages! I've sent you the track information.**`,
            });
        } catch (err) {
            console.error(err);
            return await interaction.editReply({
                content: `${client.emojiList.cross} | **I couldn't send you a DM. Please make sure your DMs are open.**`,
            });
        }
    },
};
