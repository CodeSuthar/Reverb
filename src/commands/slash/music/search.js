const {
    EmbedBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    SectionBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
    SlashCommandBuilder,
} = require("discord.js");
const { checkIfURIIsYoutubeBased, convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a song and pick from results.")
        .addStringOption((opt) =>
            opt.setName("song").setDescription("The song name or query to search for").setRequired(true)
        ),
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        let guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const voiceChannelToJoin = interaction.member.voice.channel;
        const songQuery = interaction.options.getString("song");

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.players.create({
                    guildId: interaction.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: interaction.channelId,
                });
                if (!guildPlayer.connected) await guildPlayer.connect();
            }

            if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **YouTube playback is currently disabled.**`);
                return await interaction.editReply({ embeds: [emb] });
            }

            const searchResult = await client.musicManager.search({
                query: songQuery,
                requester: interaction.user,
            });

            if (!searchResult || !searchResult.tracks.length) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | No results found for \`${songQuery}\`.`);
                return await interaction.editReply({ embeds: [emb] });
            }

            const tracks = searchResult.tracks.slice(0, 10);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("search_select")
                .setPlaceholder("Select a track to play")
                .addOptions(
                    tracks.map((t, idx) => ({
                        label: t.title.slice(0, 100),
                        description: `Duration: ${convertMillisecondsToTime(t.duration)} | By: ${(t.author || "Unknown").slice(0, 50)}`,
                        value: String(idx),
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const lines = tracks.map((t, idx) => `**${idx + 1}.** [${t.title}](${t.uri}) - \`${convertMillisecondsToTime(t.duration)}\``);
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setTitle(`Search Results: ${songQuery}`)
                .setDescription(lines.join("\n\n"))
                .setFooter({ text: "Select a song from the dropdown menu below." })
                .setTimestamp();

            const reply = await interaction.editReply({
                embeds: [emb],
                components: [row],
            });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60_000,
            });

            collector.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: "You cannot control this menu.", ephemeral: true });
                }

                const selectedTrack = tracks[Number(i.values[0])];
                await guildPlayer.queue.add(selectedTrack);

                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                const playEmb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(`${client.emojiList.tick} | **Added *[${selectedTrack.title}](${selectedTrack.uri})* to the queue.**`)
                    .setTimestamp();

                await i.update({
                    embeds: [playEmb],
                    components: [],
                });
            });

            collector.on("end", async (collected) => {
                if (!collected.size) {
                    await interaction.editReply({ components: [] }).catch(() => null);
                }
            });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred during search.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
