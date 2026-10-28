
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
    MessageFlags,
} = require("discord.js");
const {
    convertMillisecondsToTime,
} = require("../../../utils/musicUtils/index");

const accentColor = 0xFF66C4;
const tracksPerPage = 5;
const collectorTimeout = 120_000;

module.exports = {
    name: "queue",
    description: "View the current music queue.",
    usage: "",
    category: "music",
    aliases: ["q"],
    player: {
        active: true,
    },

    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(
            message.guildId,
        );

        if ((!guildPlayer.current && !guildPlayer.queue.tracks.length)) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **There is no music playing or queued in this server.**`,
                );

            return message.reply({
                embeds: [embed],
            });
        }

        const currentTrack = guildPlayer.current;
        const queuedTracks = [...guildPlayer.queue.tracks];

        const totalDuration = queuedTracks.reduce(
            (total, track) => total + (Number(track.duration) || 0),
            0,
        );

        const maxPages = Math.max(
            1,
            Math.ceil(queuedTracks.length / tracksPerPage),
        );

        let currentPage = 0;

        const queueMessage = await message.reply({
            components: [
                buildQueueView({
                    currentTrack,
                    queuedTracks,
                    currentPage,
                    maxPages,
                    totalDuration,
                    client,
                }),
            ],
            flags: MessageFlags.IsComponentsV2,
        });

        const collector = queueMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: collectorTimeout,
            idle: 60_000,
            filter: (interaction) =>
                interaction.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
            try {
                switch (interaction.customId) {
                    case "queue_previous": {
                        currentPage = Math.max(0, currentPage - 1);

                        await interaction.update({
                            components: [
                                buildQueueView({
                                    currentTrack,
                                    queuedTracks,
                                    currentPage,
                                    maxPages,
                                    totalDuration,
                                    client,
                                }),
                            ],
                        });

                        break;
                    }

                    case "queue_next": {
                        currentPage = Math.min(
                            maxPages - 1,
                            currentPage + 1,
                        );

                        await interaction.update({
                            components: [
                                buildQueueView({
                                    currentTrack,
                                    queuedTracks,
                                    currentPage,
                                    maxPages,
                                    totalDuration,
                                    client,
                                }),
                            ],
                        });

                        break;
                    }

                    case "queue_close": {
                        collector.stop("closed");

                        await interaction.update({
                            components: [
                                buildQueueView({
                                    currentTrack,
                                    queuedTracks,
                                    currentPage,
                                    maxPages,
                                    totalDuration,
                                    client,
                                    showButtons: false,
                                }),
                            ],
                        });

                        return;
                    }
                }

                if (!collector.ended) {
                    collector.resetTimer();
                }
            } catch (error) {
                console.error("[QUEUE] Failed to update queue:", error);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: "Something went wrong while updating the queue.",
                        flags: MessageFlags.Ephemeral,
                    }).catch(() => {});
                }
            }
        });

        collector.on("end", async (_, reason) => {
            if (reason === "closed") {
                return;
            }

            await queueMessage.edit({
                components: [
                    buildQueueView({
                        currentTrack,
                        queuedTracks,
                        currentPage,
                        maxPages,
                        totalDuration,
                        client,
                        showButtons: false,
                    }),
                ],
            }).catch(() => {});
        });

        return queueMessage;
    },
};

function buildQueueView({
    currentTrack,
    queuedTracks,
    currentPage,
    maxPages,
    totalDuration,
    client,
    showButtons = true,
}) {
    const container = new ContainerBuilder()
        .setAccentColor(client?.color?.number ?? accentColor);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${client.emojiList.queue} | Music Queue\n` +
            `**${queuedTracks.length}** queued track${queuedTracks.length === 1 ? "" : "s"}` +
            ` • Total duration: \`${convertMillisecondsToTime(totalDuration)}\``,
        ),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    if (currentTrack) {
        const currentDuration = Number(currentTrack.duration) || 0;

        const currentDetails = [
            `### Now Playing`,
            currentTrack.uri
                ? `**[${currentTrack.title || "Unknown Track"}](${currentTrack.uri})**`
                : `**${currentTrack.title || "Unknown Track"}**`,
            `-# ${currentTrack.author || "Unknown Artist"}`,
            `-# Duration: \`${currentDuration ? convertMillisecondsToTime(currentDuration) : "Unknown"}\``,
            currentTrack.requester
                ? `-# Requested by: ${currentTrack.requester}`
                : "",
        ].filter(Boolean).join("\n");

        const currentSection = new SectionBuilder()
            .addTextDisplayComponents(
                (display) => display.setContent(currentDetails),
            );

        if (currentTrack.artworkUrl) {
            currentSection.setThumbnailAccessory(
                (thumbnail) => thumbnail
                    .setURL(currentTrack.artworkUrl)
                    .setDescription(
                        `Artwork for ${currentTrack.title || "current track"}`,
                    ),
            );
        }

        container.addSectionComponents(currentSection);
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${client.emojiList.note} | Nothing is currently playing.**`,
            ),
        );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    if (queuedTracks.length === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "The queue is empty. Add some songs to keep the music going!",
            ),
        );
    } else {
        const offset = currentPage * tracksPerPage;
        const visibleTracks = queuedTracks.slice(
            offset,
            offset + tracksPerPage,
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### Up Next${queuedTracks.length > tracksPerPage ? ` • Page ${currentPage + 1}` : ""}`,
            ),
        );

        for (const [index, track] of visibleTracks.entries()) {
            const trackNumber = offset + index + 1;
            const duration = Number(track.duration) || 0;

            const trackDetails = [
                track.uri
                    ? `**${trackNumber}. [${track.title || "Unknown Track"}](${track.uri})**`
                    : `**${trackNumber}. ${track.title || "Unknown Track"}**`,
                `-# ${track.author || "Unknown Artist"}`,
                `-# ${duration ? convertMillisecondsToTime(duration) : "Unknown duration"}` +
                    (track.requester ? ` • Requested by ${track.requester}` : ""),
            ].join("\n");

            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    (display) => display.setContent(trackDetails),
                );

            if (track.artworkUrl) {
                section.setThumbnailAccessory(
                    (thumbnail) => thumbnail
                        .setURL(track.artworkUrl)
                        .setDescription(
                            `Artwork for ${track.title || "queued track"}`,
                        ),
                );
            }

            container.addSectionComponents(section);
        }
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# Page ${currentPage + 1} of ${maxPages} • ` +
            `${queuedTracks.length} queued • ` +
            `Total duration excludes the currently playing track`,
        ),
    );

    if (showButtons && maxPages > 1) {
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("queue_previous")
                    .setEmoji(client.emojiList.buttons.previous)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),

                new ButtonBuilder()
                    .setCustomId("queue_close")
                    .setEmoji(client.emojiList.buttons.close)
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("queue_next")
                    .setEmoji(client.emojiList.buttons.next)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= maxPages - 1),
            ),
        );
    } else if (showButtons) {
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("queue_close")
                    .setEmoji(client.emojiList.buttons.close)
                    .setStyle(ButtonStyle.Secondary),
            ),
        );
    }

    return container;
}