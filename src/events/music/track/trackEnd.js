const {
    buildSetupView, updateVoiceStatus
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "trackEnd",
    run: async (client, player, track) => {
        if (!player || !track) return;

        // If no more tracks are queued, clear voice status immediately
        const hasNext = Boolean(player.queue?.tracks?.length || player.queue?.size);
        if (!hasNext) {
            await updateVoiceStatus(client, player, "");
        }

        // Delete track player message for the ended track
        try {
            const trackMessageId = await player.getTrackMessage?.(player.guildId);
            if (trackMessageId) {
                const channelId = player.textChannelId;
                const textChannel =
                    player.textChannel ||
                    (channelId ? client.channels.cache.get(channelId) : null) ||
                    (channelId ? await client.channels.fetch(channelId).catch(() => null) : null);

                if (textChannel) {
                    const trackMessage =
                        textChannel.messages?.cache?.get(trackMessageId) ||
                        (await textChannel.messages?.fetch(trackMessageId).catch(() => null));

                    if (trackMessage) await trackMessage.delete().catch(() => null);
                }
                await player.clearTrackMessage?.(player.guildId);
            }
        } catch (_) {}

        // Update persistent Song Requests setup message
        try {
            const setupData = await client.database.getSetup(player.guildId);
            if (setupData?.textChannelId && setupData?.messageId) {
                const setupChannel =
                    client.channels.cache.get(setupData.textChannelId) ||
                    (await client.channels.fetch(setupData.textChannelId).catch(() => null));

                if (setupChannel) {
                    const setupMessage =
                        setupChannel.messages?.cache?.get(setupData.messageId) ||
                        (await setupChannel.messages?.fetch(setupData.messageId).catch(() => null));

                    if (setupMessage) {
                        const setupView = buildSetupView(client, player);
                        await setupMessage.edit(setupView).catch(() => null);
                    }
                }
            }
        } catch (_) {}
    }
};
