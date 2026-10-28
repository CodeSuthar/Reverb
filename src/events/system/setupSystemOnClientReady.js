const {
    buildSetupView
} = require("../../utils/musicUtils/index");
const logger = require("../../utils/logger");

module.exports = {
    name: "clientReady",
    run: async (client) => {
        const log = client.logger || logger;

        try {
            const allSetups = await client.database.getSetup();
            if (!allSetups || !Array.isArray(allSetups) || allSetups.length === 0) {
                return;
            }

            log.info(`Checking ${allSetups.length} song-request setup system(s) on startup...`);
            let updatedCount = 0;

            for (const setupData of allSetups) {
                const {
    guildId, textChannelId, messageId
} = setupData;
                if (!guildId || !textChannelId) continue;

                try {
                    const guild =
                        client.guilds.cache.get(guildId) ||
                        (await client.guilds.fetch(guildId).catch(() => null));

                    if (!guild) {
                        continue;
                    }

                    const channel =
                        guild.channels.cache.get(textChannelId) ||
                        (await guild.channels.fetch(textChannelId).catch(() => null)) ||
                        client.channels.cache.get(textChannelId) ||
                        (await client.channels.fetch(textChannelId).catch(() => null));

                    if (!channel) {
                        // Channel was removed while the bot was offline
                        await client.database.deleteSetup(guildId).catch(() => null);
                        continue;
                    }

                    const guildPlayer = client.musicManager?.players?.get(guildId);
                    const viewPayload = buildSetupView(client, guildPlayer || guildId);

                    let setupMessage = null;
                    if (messageId) {
                        setupMessage =
                            channel.messages?.cache?.get(messageId) ||
                            (await channel.messages?.fetch(messageId).catch(() => null));
                    }

                    if (setupMessage) {
                        // Edit existing setup message to restore clean idle or current player state
                        await setupMessage.edit(viewPayload).catch((err) => {
                            log.warn(`[SETUP_ON_READY] Failed to edit setup message for guild ${guildId}:`, err?.message || err);
                        });
                        updatedCount++;
                    } else {
                        // Message was deleted while offline: recreate and update database
                        const newMsg = await channel.send(viewPayload).catch((err) => {
                            log.warn(`[SETUP_ON_READY] Failed to recreate setup message for guild ${guildId}:`, err?.message || err);
                            return null;
                        });

                        if (newMsg) {
                            await client.database.setSetup(
                                guildId,
                                channel.id,
                                newMsg.id,
                                channel.parentId
                            );
                            updatedCount++;
                        }
                    }
                } catch (err) {
                    log.warn(`[SETUP_ON_READY] Error updating setup for guild ${guildId}:`, err?.message || err);
                }
            }

            if (updatedCount > 0) {
                log.success(`Successfully updated ${updatedCount} setup view(s) to clean state.`);
            }
        } catch (error) {
            log.error("[SETUP_ON_READY] Error during startup setup synchronization:", error);
        }
    },
};
