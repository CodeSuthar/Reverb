const {
    EmbedBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const {
    checkIfURIIsYoutubeBased,
    convertMillisecondsToTime
} = require("../../../utils/musicUtils/index");

let tracksPerPage = 5;

module.exports = {
    name: "search",
    description: "Search for a song.",
    usage: "<song name or URL>",
    category: "music",
    aliases: ["find", "lookup", "searchsong"],
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },

    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (!args.length) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a song name or URL to search for.\nUsage: \`${prefix}search <song name or URL>\`**`
                );

            return message.reply({ embeds: [embed] });
        }

        const voiceChannelToJoin = message.member.voice.channel;

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.players.create({
                    guildId: message.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: message.channelId
                });

                if (!guildPlayer.connected) {
                    await guildPlayer.connect();
                }
            }

            const songQuery = args.join(" ");

            if (
                checkIfURIIsYoutubeBased(songQuery) &&
                !client.config.music.playYoutube
            ) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.`
                    )
                    .addFields({
                        name: "Alternative Sources",
                        value:
                            "You can use sources like Spotify, SoundCloud, or other supported platforms to play music.",
                        inline: false
                    });

                return message.reply({ embeds: [embed] });
            }

            const searchResult = await client.musicManager.search({
                query: songQuery,
                requester: message.author
            });

            if (!searchResult?.tracks?.length) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | No results found for \`${songQuery}\`.`
                    );

                return message.reply({ embeds: [embed] });
            }

            let currentPage = 0;
            const maxPages = Math.ceil(
                searchResult.tracks.length / tracksPerPage
            );

            const msg = await message.reply({
                components: [
                    buildSearchView(
                        searchResult.tracks,
                        { currentPage, maxPages },
                        client.emojiList
                    )
                ], flags: MessageFlags.IsComponentsV2
            });

            const collector = msg.createMessageComponentCollector({
                filter: (interaction) =>
                    interaction.user.id === message.author.id,
                time: 120000,
                idle: 60000
            });

            collector.on("collect", async (interaction) => {
                try {
                    switch (interaction.customId) {
                        case "select_trackmenu": 
                            const selectedIndex = Number.parseInt(
                                interaction.values[0],
                                10
                            );

                            const track = searchResult.tracks[selectedIndex];

                            await interaction.deferUpdate();

                            if (!track) {
                                const errorEmbed = new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **The selected option is invalid. Please select a song number from the list.**`
                                    );

                                await interaction.followUp({
                                    embeds: [errorEmbed],
                                    flags: MessageFlags.Ephemeral
                                });

                                return;
                            }

                            guildPlayer.queue.add(track);

                            if (!guildPlayer.playing || guildPlayer.paused) {
                                await guildPlayer.play({ paused: false });
                            }

                            const embed = new EmbedBuilder()
                                .setColor(client?.color?.hex ?? "#FF66C4")
                                .setDescription(
                                    `${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to the queue.**`
                                )
                                .addFields(
                                    {
                                        name: "Duration",
                                        value: `\`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\``,
                                        inline: true
                                    },
                                    {
                                        name: "Requester",
                                        value: `${message.member}`,
                                        inline: true
                                    }
                                )
                                .setTimestamp();

                            if (track.artworkUrl) {
                                embed.setThumbnail(track.artworkUrl);
                            }

                            await msg.delete();

                            await message.reply({
                                embeds: [embed]
                            });

                            collector.stop("trackSelected");
                            break;
                        case "previous_page":
                            if (currentPage > 0) {
                                currentPage--;
                            }

                            await interaction.deferUpdate();

                            if (currentPage >= 0) {
                                await msg.edit({
                                    components: [
                                        buildSearchView(
                                            searchResult.tracks,
                                            { currentPage, maxPages },
                                            client.emojiList
                                        )
                                    ]
                                });
                            }

                            break;
                        case "close_search":
                            await interaction.deferUpdate();

                            let closedContainer = new ContainerBuilder()
                                .setAccentColor(0xFF0000)
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        `**${client.emojiList.cross} | Search Closed!**\nThe search has been closed by the user. Please try again if you wish to search for another song.`
                                    )
                                );

                            await msg.edit({
                                components: [closedContainer]
                            });
                            break;
                        case "next_page":
                            if (currentPage < maxPages - 1) {
                                currentPage++;
                            }

                            await interaction.deferUpdate();

                            await msg.edit({
                                components: [
                                    buildSearchView(
                                        searchResult.tracks,
                                        { currentPage, maxPages },
                                        client.emojiList
                                    )
                                ]
                            });

                            break;
                    }

                    collector.resetTimer();
                } catch (error) {
                    console.error("Search interaction failed:", error);

                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: "Something went wrong while handling your selection.",
                            flags: MessageFlags.Ephemeral
                        }).catch(() => { });
                    }
                }
            });

            collector.on("end", async (_collected, reason) => {
                if (reason === "closed") return;

                const timeoutContainer = new ContainerBuilder()
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**${client.emojiList.timeout} | Time Expired!**\nNo song was selected within the given time. The search has been canceled. Please try again.`
                        )
                    );

                await msg.edit({
                    components: [timeoutContainer]
                });
            });
        } catch (error) {
            console.dir(error, { depth: null });

            if (error.errors) {
                console.dir(error.errors, { depth: null });
            }

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while searching for tracks.**`
                );

            return message.reply({ embeds: [embed] });
        }
    }
};

function buildSearchView(tracks, pageOptions, emojiList, client) {
    let { currentPage, maxPages } = pageOptions;
    const offset = currentPage * tracksPerPage;
    const visibleTracks = tracks.slice(
        offset,
        offset + tracksPerPage
    );

    const container = new ContainerBuilder()
        .setAccentColor(client?.color?.number ?? 0xFF66C4);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${emojiList.note}  | Search Results\n` +
            `Found **${tracks.length} tracks** for your query.\n` +
            `Select a track below to add it to the queue.`
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    for (const [position, track] of visibleTracks.entries()) {
        const number = offset + position + 1;

        const details = [
            `**${number}. ${track.title}**`,
            `-# ${track.author || "Unknown Artist"}`,
            `-# \`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\``
        ].join("\n");

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                (display) => display.setContent(details)
            );

        if (track.artworkUrl) {
            section.setThumbnailAccessory(
                (thumbnail) =>
                    thumbnail
                        .setURL(track.artworkUrl)
                        .setDescription(`Artwork for ${track.title}`)
            );
        }

        container.addSectionComponents(section);
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# Page ${currentPage + 1} of ${maxPages} • ${visibleTracks.length} tracks shown`
        )
    );

    const menu = new StringSelectMenuBuilder()
        .setCustomId("select_trackmenu")
        .setPlaceholder("Choose a track to play...")
        .addOptions(
            visibleTracks.map((track, index) => ({
                label: `${offset + index + 1}. ${track.title}`.slice(0, 100),
                description: (track.author || "Unknown Artist").slice(0, 100),
                value: String(offset + index)
            }))
        );

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(menu),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("previous_page")
                .setEmoji(emojiList.buttons.previous)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId("close_search")
                .setEmoji(emojiList.buttons.close)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("next_page")
                .setEmoji(emojiList.buttons.next)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage >= maxPages - 1)
        )
    );

    return container;
}