
const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const {
    convertMillisecondsToTime
} = require("../../../utils/musicUtils");

module.exports = {
    name: "grab",
    description: "Send the currently playing track to your DMs.",
    usage: "",
    category: "music",
    aliases: ["dm", "send", "grabtrack", "grabnowplaying"],
    player: {
        active: true,
        playing: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        let track = guildPlayer.current;

        try {
            let container = new ContainerBuilder()
                .setAccentColor(client?.color?.number ?? 0xFF66C4);

            let newSection = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## [${track.title}](${track.uri})\n` +
                            `**Artist:** ${track.author || "Unknown"}\n` +
                            `**Duration:** ${track.duration ? `${convertMillisecondsToTime(track.duration)}` : track.isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\n` +
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

            if (track.artworkUrl) {
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder()
                        .addItems(
                            new MediaGalleryItemBuilder()
                                .setURL(track.artworkUrl)
                        )
                );
            }

            await message.author.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | **I've sent you the currently playing track in your DMs.**`,
                        ),
                ],
            });
        } catch (err) {
            console.dir(err, { depth: null });

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **I couldn't DM you. Please check your DM privacy settings.**`
                );

            return message.reply({
                embeds: [emb],
            });
        }
    },
};