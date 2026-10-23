const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
} = require("discord.js");
const { convertMillisecondsToTime, executeViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "queueEnd",
    run: async (client, player, lastTrack) => {
        if (!player) return;

        // 1. Synchronize the persistent setup view (if active in this guild)
        await executeViewUpdate(client, player);

        // 2. Clean up previous track player message if present
        try {
            const trackMessageId = await player.getTrackMessage?.(player.guildId);
            if (trackMessageId) {
                const textChannel =
                    player.textChannel ||
                    (player.textChannelId ? client.channels.cache.get(player.textChannelId) : null) ||
                    (player.textChannelId ? await client.channels.fetch(player.textChannelId).catch(() => null) : null);

                if (textChannel) {
                    const trackMsg =
                        textChannel.messages?.cache?.get(trackMessageId) ||
                        (await textChannel.messages?.fetch(trackMessageId).catch(() => null));
                    if (trackMsg) await trackMsg.delete().catch(() => null);
                }
                await player.clearTrackMessage?.(player.guildId);
            }
        } catch (_) {}

        // 3. Check text channel and skip if it's the dedicated song-requests channel
        const setupData = await client.database.getSetup(player.guildId).catch(() => null);
        const channelId = player.textChannelId;
        if (!channelId || channelId === setupData?.textChannelId) return;

        const textChannel =
            player.textChannel ||
            client.channels.cache.get(channelId) ||
            (await client.channels.fetch(channelId).catch(() => null));

        if (!textChannel || !textChannel.send) return;

        // 4. Retrieve prefix for guild
        let prefix = client?.config?.bot?.prefix || client?.prefix || "r!";
        try {
            const prefixData = await client.database.getPrefix(player.guildId);
            if (typeof prefixData === "string") prefix = prefixData;
            else if (prefixData?.prefix) prefix = prefixData.prefix;
        } catch (_) {}

        // 5. Construct Components V2 Container inline (no external function)
        const accentColor = client?.color?.number ?? 0xFF66C4;
        const container = new ContainerBuilder().setAccentColor(accentColor);
        const botName = client?.botName || client?.user?.username || "Reverb";
        const voiceChannelId = player?.voiceChannelId;
        const voiceMention = voiceChannelId ? `<#${voiceChannelId}>` : "your voice channel";

        // Header section with bot avatar accessory
        const botAvatar = client?.user?.displayAvatarURL?.({ size: 256 }) || null;
        const headerTitle = `# ${client.emojiList.flag} | Queue Ended`;
        const headerSubtitle = `-# All queued tracks have finished playing in ${voiceMention}.`;

        if (botAvatar) {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${headerTitle}\n${headerSubtitle}`),
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(botAvatar)),
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${headerTitle}\n${headerSubtitle}`),
            );
        }

        container.addSeparatorComponents(new SeparatorBuilder());

        // Body with guidance and last track info
        const lines = [
            `### Looks like the queue has ended!`,
            `The music has stopped because there are no more songs waiting in the queue.`,
            `Ready for more tunes? Request more tracks anytime using:`,
            `> \`${prefix}play <song title or URL>\` or use \`/play\``,
        ];

        if (lastTrack) {
            const title = lastTrack.title || "Unknown Track";
            const uri = lastTrack.uri || lastTrack.url || "";
            const durationStr = lastTrack.duration
                ? `\`${convertMillisecondsToTime(lastTrack.duration)}\``
                : "`Unknown`";
            const trackLink = uri ? `[${title}](${uri})` : `**${title}**`;

            lines.push(
                "",
                `**Last Played Track:**`,
                `• ${trackLink} (${durationStr})`,
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join("\n")),
        );

        container.addSeparatorComponents(new SeparatorBuilder());

        // Pro-tip footer
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# ${client.emojiList.lightbulb} Tip: You can toggle Autoplay using \`${prefix}autoplay\` to automatically keep playing similar songs when the queue ends!`,
            ),
        );

        // Action row buttons: Replay last track, Invite bot, Support server
        const buttons = [
            new ButtonBuilder()
                .setCustomId("player_previous")
                .setLabel("Replay Last Track")
                .setEmoji(client.emojiList.loop.default)
                .setStyle(ButtonStyle.Primary),
        ];

        if (client?.config?.bot?.invite) {
            buttons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel(`Invite ${botName}`)
                    .setURL(client.config.bot.invite),
            );
        }

        if (client?.config?.bot?.supportServer) {
            buttons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Support Server")
                    .setURL(client.config.bot.supportServer),
            );
        }

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(buttons),
        );

        // Send Components V2 message
        await textChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        }).catch((err) => {
            client.logger?.warn?.(`[QUEUE_END] Failed to send queue ended message:`, err);
        });
    },
};
