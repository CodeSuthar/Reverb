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
} = require("../../../utils/musicUtils/index.js");

const accentColor = 0xFF66C4;
const lyricsPerPage = 12;
const maxPageLength = 3000;
const collectorTimeout = 120_000;

module.exports = {
    name: "lyrics",
    description: "Shows lyrics for the currently playing music or a searched song.",
    usage: "[song name]",
    category: "music",
    aliases: ["ly", "lyric", "songlyrics", "findlyrics"],

    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(
            message.guildId,
        );

        const searchingByName = args.length > 0;

        let track;
        let lyricsClient = guildPlayer?.lyricsClient || client.musicManager.lyricsClient;;

        // Resolve the track.
        if (searchingByName) {
            const songQuery = args.join(" ").trim();

            if (!songQuery) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **Please provide a song name to search for.**`,
                            ),
                    ],
                });
            }

            let searchResult;

            try {
                searchResult = await client.musicManager.search({
                    query: songQuery,
                    requester: message.author,
                });
            } catch (error) {
                console.error("[LYRICS] Music search failed:", error);

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **An error occurred while searching for that song. Please try again.**`,
                            ),
                    ],
                });
            }

            track = searchResult?.tracks[0];

            if (!track) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **I couldn't find a track matching \`${songQuery}\`.**`,
                            ),
                    ],
                });
            }
        } else {
            // No arguments: use the currently playing track.
            track = guildPlayer?.current;

            if (!track) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **No track is currently playing. Use \`lyrics <song name>\` to search for lyrics.**`,
                            ),
                    ],
                });
            }
        }

        if (!lyricsClient) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **The lyrics service is not configured.**`,
                        ),
                ],
            });
        }

        // Normalize metadata from the resolved track.
        const trackName = track.title || "Unknown Track";
        const artistName = track.author || "Unknown Artist";
        const duration = Number(track.duration) || 0;
        const trackUri = track.uri || null;
        const artworkUrl = track.artworkUrl || null;

        const query = {
            track_name: trackName,
            artist_name: track.author || "",
            duration,
        };

        try {
            let lyrics = null;
            let isSynced = false;
            let syncedError = null;
            let plainError = null;

            // Try synchronized lyrics first.
            try {
                lyrics = await lyricsClient.getSynced(query);

                isSynced = Array.isArray(lyrics) && lyrics.length > 0;
            } catch (error) {
                syncedError = error;

                console.warn(
                    `[LYRICS] Synced lyrics lookup failed (${error.status || "unknown"}):`,
                    error.message,
                );
            }

            // Fall back to plain lyrics when synced lyrics aren't found.
            if (!isSynced) {
                try {
                    lyrics = await lyricsClient.getUnsynced(query);
                } catch (error) {
                    plainError = error;
                    lyrics = null;

                    console.warn(
                        `[LYRICS] Plain lyrics lookup failed (${error.status || "unknown"}):`,
                        error.message,
                    );
                }
            }

            if (!Array.isArray(lyrics) || lyrics.length === 0) {
                const errors = [syncedError, plainError].filter(Boolean);

                // LRCLIB 503 often occurs when a matching entry isn't available.
                // Treat it as unavailable lyrics instead of a generic outage.
                const lyricsUnavailable = errors.some(
                    (error) => Number(error.status) === 503,
                );

                const description = lyricsUnavailable
                    ? `**Lyrics for [${trackName}](${trackUri || "https://lrclib.net"}) aren't available in the lyrics API.**`
                    : errors.length > 0
                        ? "**The lyrics lookup failed. Please try again later.**"
                        : `**No lyrics were found in the lyrics API for [${trackName}](${trackUri || "https://lrclib.net"}).**`;

                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | ${description}`,
                            ),
                    ],
                });
            }

            // Convert the lyrics response into displayable lines.
            const lyricLines = lyrics
                .map((line) => {
                    if (typeof line === "string") {
                        return line;
                    }

                    const text = line.text || "";

                    if (
                        isSynced &&
                        typeof line.startTime === "number"
                    ) {
                        const timestamp = convertMillisecondsToTime(
                            line.startTime * 1000,
                        );

                        return `\`${timestamp}\` ${text}`;
                    }

                    return text;
                })
                .filter(Boolean);

            if (!lyricLines.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | **The lyrics response was empty.**`,
                            ),
                    ],
                });
            }

            // Split lyrics into pages.
            const pages = [];
            let currentLines = [];
            let currentLength = 0;

            for (const line of lyricLines) {
                const safeLine = line.slice(0, maxPageLength);
                const addedLength =
                    safeLine.length +
                    (currentLines.length > 0 ? 1 : 0);

                if (
                    currentLines.length > 0 &&
                    (
                        currentLines.length >= lyricsPerPage ||
                        currentLength + addedLength > maxPageLength
                    )
                ) {
                    pages.push(currentLines.join("\n"));
                    currentLines = [];
                    currentLength = 0;
                }

                currentLines.push(safeLine);
                currentLength += safeLine.length +
                    (currentLines.length > 1 ? 1 : 0);
            }

            if (currentLines.length > 0) {
                pages.push(currentLines.join("\n"));
            }

            let currentPageIndex = 0;

            // Build the Component V2 lyrics container.
            const createContainer = (pageIndex, showButtons = true) => {
                const container = new ContainerBuilder()
                    .setAccentColor(client?.color?.number ?? accentColor);

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${client.emojiList.lyrics} | Lyrics`,
                    ),
                );

                container.addSeparatorComponents(
                    new SeparatorBuilder(),
                );

                const displayTitle = trackUri
                    ? `[${trackName}](${trackUri})`
                    : trackName;

                const section = new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `### ${displayTitle}\n` +
                            `**Artist:** ${artistName}\n` +
                            `**Duration:** \`${duration ? convertMillisecondsToTime(duration) : "Unknown"}\`\n` +
                            `**Lyrics:** ${isSynced ? "Synced" : "Plain"}`,
                        ),
                    );

                if (artworkUrl) {
                    section.setThumbnailAccessory((thumbnail) =>
                        thumbnail
                            .setURL(artworkUrl)
                            .setDescription(`Artwork for ${trackName}`),
                    );
                }

                container.addSectionComponents(section);

                container.addSeparatorComponents(
                    new SeparatorBuilder(),
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        pages[pageIndex],
                    ),
                );

                container.addSeparatorComponents(
                    new SeparatorBuilder(),
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# Page ${pageIndex + 1} of ${pages.length}`,
                    ),
                );

                if (showButtons && pages.length > 1) {
                    const buttons = [
                        new ButtonBuilder()
                            .setCustomId("lyrics_previous")
                            .setEmoji(client.emojiList.buttons.previous)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(pageIndex === 0),

                        new ButtonBuilder()
                            .setCustomId("lyrics_close")
                            .setEmoji(client.emojiList.buttons.close)
                            .setStyle(ButtonStyle.Secondary),

                        new ButtonBuilder()
                            .setCustomId("lyrics_next")
                            .setEmoji(client.emojiList.buttons.next)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(
                                pageIndex >= pages.length - 1,
                            ),
                    ];

                    container.addActionRowComponents(
                        new ActionRowBuilder().addComponents(...buttons),
                    );
                }

                return container;
            };

            const lyricsMessage = await message.reply({
                components: [
                    createContainer(currentPageIndex),
                ],
                flags: MessageFlags.IsComponentsV2,
            });

            if (pages.length <= 1) {
                return lyricsMessage;
            }

            const collector = lyricsMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: collectorTimeout,
                idle: 60_000,
                filter: (interaction) =>
                    interaction.user.id === message.author.id,
            });

            collector.on("collect", async (interaction) => {
                try {
                    switch (interaction.customId) {
                        case "lyrics_previous": {
                            currentPageIndex = Math.max(
                                0,
                                currentPageIndex - 1,
                            );

                            await interaction.update({
                                components: [
                                    createContainer(currentPageIndex),
                                ],
                            });

                            break;
                        }

                        case "lyrics_next": {
                            currentPageIndex = Math.min(
                                pages.length - 1,
                                currentPageIndex + 1,
                            );

                            await interaction.update({
                                components: [
                                    createContainer(currentPageIndex),
                                ],
                            });

                            break;
                        }

                        case "lyrics_close": {
                            collector.stop("closed");

                            await interaction.update({
                                components: [
                                    createContainer(currentPageIndex, false),
                                ],
                            });

                            break;
                        }
                    }

                    if (!collector.ended) {
                        collector.resetTimer();
                    }
                } catch (error) {
                    console.error(
                        "[LYRICS] Failed to update lyrics page:",
                        error,
                    );

                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content:
                                "Something went wrong while updating the lyrics.",
                            flags: MessageFlags.Ephemeral,
                        }).catch(() => {});
                    }
                }
            });

            collector.on("end", async (_, reason) => {
                if (reason === "closed") {
                    return;
                }

                await lyricsMessage.edit({
                    components: [
                        createContainer(currentPageIndex, false),
                    ],
                }).catch(() => {});
            });

            return lyricsMessage;
        } catch (error) {
            console.error("[LYRICS] Failed to fetch lyrics:", error);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **An error occurred while fetching lyrics. Please try again later.**`,
                        ),
                ],
            });
        }
    },
};