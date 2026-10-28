const {
    updateVoiceStatus, executeViewUpdate
} = require("../../../utils/musicUtils/index");
const logger = require("../../../utils/logger");

module.exports = {
    name: "playerDestroy",
    run: async (client, player, reason) => {
        if (!player) return;

        const log = client.logger || logger;

        // Clear voice channel status automatically on player destruction
        await updateVoiceStatus(client, player, "");

        // Delete track player message and reset setup view to idle
        await executeViewUpdate(client, player, { destroyed: true });

        // If the guild has 24/7 mode enabled, auto-rejoin the voice channel
        try {
            const stayData = await client.database.getTwentyFourSeven(player.guildId);
            if (stayData && stayData.voiceChannelId) {
                const guild =
                    client.guilds.cache.get(player.guildId) ||
                    (await client.guilds.fetch(player.guildId).catch(() => null));

                if (!guild) return;

                const voiceChannel =
                    guild.channels.cache.get(stayData.voiceChannelId) ||
                    (await guild.channels.fetch(stayData.voiceChannelId).catch(() => null));

                if (!voiceChannel) {
                    // Voice channel no longer exists, clean up database record
                    await client.database.deleteTwentyFourSeven(player.guildId).catch(() => null);
                    return;
                }

                // Wait 1 second for Discord gateway & Lavalink state cleanup to settle before reconnecting
                setTimeout(async () => {
                    try {
                        const existingPlayer = client.musicManager.players.get(player.guildId);
                        if (existingPlayer && existingPlayer.connected) return;

                        const newPlayer = await client.musicManager.players.create({
                            guildId: stayData.guildId,
                            voiceChannelId: stayData.voiceChannelId,
                            textChannelId: stayData.textChannelId,
                            autoLeave: false,
                        });

                        if (typeof newPlayer.setAutoLeave === "function") {
                            newPlayer.setAutoLeave(false);
                        }

                        if (!newPlayer.connected) {
                            await newPlayer.connect();
                        }
                    } catch (err) {
                        log.error(`[24/7] Failed to auto-rejoin voice channel in guild ${player.guildId}:`, err);
                    }
                }, 1000);
            }
        } catch (err) {
            log.error(`[PLAYER_DESTROY] Error checking 24/7 configuration for guild ${player.guildId}:`, err);
        }
    }
};
