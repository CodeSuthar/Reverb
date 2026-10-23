const buildSetupView = require("../buildSetupView.js");
const buildTrackPlayer = require("../buildTrackPlayer.js");

// Coalescing / debounce map to prevent redundant API calls from rapid successive events
const pendingViewUpdates = new Map();

/**
 * Updates Discord voice channel status automatically based on player state.
 * - Paused: [pause emoji] • [track title]
 * - Playing/Resumed: [note emoji] • [track title]
 * - Stopped/Destroyed/Empty: "" (clears status)
 *
 * @param {import("../../structures/client.js")} client
 * @param {import("../../structures/reverbPlayer.js")} player
 * @param {string|null} [customStatus]
 */
async function updateVoiceStatus(client, player, customStatus = null) {
    if (!player || !player.voiceChannelId) return;

    let statusText = "";
    let ellipsis = "";
    if (typeof customStatus === "string") {
        statusText = customStatus;
        let ellipsis = statusText.length > 128 ? statusText.substring(0, 125) + "..." : statusText;
    } else if (player.current && !player.destroyed && !player.stopped) {
        const track = player.current;
        const icon = player.paused
            ? client.emojiList.pause
            : client.emojiList.note;
        const title = track.title || "Music";
        statusText = `${icon} **Playing:** ${title}`;
        ellipsis = statusText.length > 128 ? statusText.substring(0, 125) + "..." : statusText;
    }

    // Avoid redundant Discord REST calls if status hasn't changed
    if (player._lastVoiceStatus === ellipsis) return;
    player._lastVoiceStatus = ellipsis;

    try {
        await client.rest.put(`/channels/${player.voiceChannelId}/voice-status`, {
            body: { status: ellipsis },
        });
    } catch (_) {
        // Voice channel status may fail if bot lacks permission or feature is disabled
    }
}

/**
 * Executes updates for both the song-requests setup message and track player message across channels.
 *
 * @param {import("../../structures/client.js")} client
 * @param {import("../../structures/reverbPlayer.js")} player
 * @param {object} [options]
 * @param {boolean} [options.stopped]
 * @param {boolean} [options.destroyed]
 */
async function executeViewUpdate(client, player, options = {}) {
    if (!player || !player.guildId) return;
    const guildId = player.guildId;

    // 1. Update Song Requests Channel Setup View (if configured for this server)
    try {
        const setupData = await client.database.getSetup(guildId);
        if (setupData?.textChannelId) {
            const setupChannel =
                client.channels.cache.get(setupData.textChannelId) ||
                (await client.channels.fetch(setupData.textChannelId).catch(() => null));

            if (!setupChannel) {
                // Setup channel was removed from Discord
                await client.database.deleteSetup(guildId).catch(() => null);
            } else {
                const setupView = buildSetupView(client, player);
                let setupMessage = null;

                if (setupData.messageId) {
                    setupMessage =
                        setupChannel.messages?.cache?.get(setupData.messageId) ||
                        (await setupChannel.messages?.fetch(setupData.messageId).catch(() => null));
                }

                if (setupMessage) {
                    await setupMessage.edit(setupView).catch((err) => {
                        client.logger?.warn?.(`[PLAYER_UPDATER] Failed to edit setup view for guild ${guildId}:`, err);
                    });
                } else {
                    // Setup message was deleted: recreate and persist new messageId
                    const newMsg = await setupChannel.send(setupView).catch((err) => {
                        client.logger?.warn?.(`[PLAYER_UPDATER] Failed to recreate setup view for guild ${guildId}:`, err);
                        return null;
                    });

                    if (newMsg) {
                        await client.database.setSetup(
                            guildId,
                            setupChannel.id,
                            newMsg.id,
                            setupChannel.parentId
                        );
                    }
                }
            }
        }
    } catch (err) {
        client.logger?.warn(`[PLAYER_UPDATER] Error updating setup view for guild ${guildId}:`, err);
    }

    // 2. Update Track Player Message in Standard Text Channel
    try {
        const trackMessageId = await player.getTrackMessage?.(guildId);
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

                if (trackMessage) {
                    if (options.stopped || options.destroyed || !player.current) {
                        await trackMessage.delete().catch(() => null);
                        await player.clearTrackMessage?.(guildId);
                    } else {
                        const trackPlayerView = buildTrackPlayer(client, player);
                        await trackMessage.edit(trackPlayerView).catch(() => null);
                    }
                }
            }
        }
    } catch (err) {
        client.logger?.warn(`[PLAYER_UPDATER] Error updating track player view for guild ${guildId}:`, err);
    }
}

/**
 * Debounced view update (100ms) to coalesce rapid successive events.
 *
 * @param {import("../../structures/client.js")} client
 * @param {import("../../structures/reverbPlayer.js")} player
 * @param {object} [options]
 */
function queueViewUpdate(client, player, options = {}) {
    if (!player || !player.guildId) return;
    const guildId = player.guildId;

    if (pendingViewUpdates.has(guildId)) {
        clearTimeout(pendingViewUpdates.get(guildId));
    }

    const timer = setTimeout(async () => {
        pendingViewUpdates.delete(guildId);
        await executeViewUpdate(client, player, options);
    }, 100);

    pendingViewUpdates.set(guildId, timer);
}

module.exports = {
    updateVoiceStatus,
    executeViewUpdate,
    queueViewUpdate,
};
