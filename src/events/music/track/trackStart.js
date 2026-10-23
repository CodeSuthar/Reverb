const { buildTrackPlayer, buildSetupView, updateVoiceStatus } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "trackStart",
    run: async (client, player, track) => {
        if (!player || !track) return;

        player.paused = false;

        // Automatically set voice channel status to: 🎵 • Track Title
        await updateVoiceStatus(client, player);

        let setupData = await client.database.getSetup(player.guildId);

        // Send Track Player message in standard text channels (if not in song-requests setup channel)
        const textChannel =
            player.textChannel ||
            (player.textChannelId ? client.channels.cache.get(player.textChannelId) : null) ||
            (player.textChannelId ? await client.channels.fetch(player.textChannelId).catch(() => null) : null);

        if (textChannel && player.textChannelId !== setupData?.textChannelId) {
            try {
                // Delete previous track message if exists
                const previousMessageId = await player.getTrackMessage?.(player.guildId);
                if (previousMessageId) {
                    const previousMsg =
                        textChannel.messages?.cache?.get(previousMessageId) ||
                        (await textChannel.messages?.fetch(previousMessageId).catch(() => null));
                    if (previousMsg) await previousMsg.delete().catch(() => null);
                }

                const trackPlayer = buildTrackPlayer(client, player);
                const trackMessage = await textChannel.send(trackPlayer);
                await player.setTrackMessage({ guildId: player.guildId, messageId: trackMessage.id });
            } catch (err) {
                client.logger?.warn(`[TRACK_START] Error sending track player view:`, err);
            }
        }

        // Update persistent Song Requests setup message
        if (setupData?.textChannelId && setupData?.messageId) {
            try {
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
            } catch (err) {
                client.logger?.warn(`[TRACK_START] Error updating setup view:`, err);
            }
        }
    }
};
