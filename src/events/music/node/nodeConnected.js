const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeConnected",
    run: async (client, node) => {
        const log = client.logger || logger;
        log.success(`Connected to Lavalink node: ${node.identifier}`);

        // 1. Reconnect 24/7 players and clean orphan 24/7 database records
        try {
            let twentyFourSevenList = await client.database.getTwentyFourSeven();
            if (twentyFourSevenList && twentyFourSevenList.length > 0) {
                for (const stayData of twentyFourSevenList) {
                    const { guildId, textChannelId, voiceChannelId } = stayData;

                    let guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
                    if (!guild) {
                        await client.database.deleteTwentyFourSeven(guildId).catch(() => null);
                        continue;
                    }

                    let textChannel = guild.channels.cache.get(textChannelId) || await guild.channels.fetch(textChannelId).catch(() => null);
                    if (!textChannel) {
                        await client.database.deleteTwentyFourSeven(guildId).catch(() => null);
                        continue;
                    }

                    let voiceChannel = guild.channels.cache.get(voiceChannelId) || await guild.channels.fetch(voiceChannelId).catch(() => null);
                    if (!voiceChannel) {
                        await client.database.deleteTwentyFourSeven(guildId).catch(() => null);
                        continue;
                    }

                    try {
                        let guildPlayer = await client.musicManager.players.create({
                            guildId: guildId,
                            voiceChannelId: voiceChannelId,
                            textChannelId: textChannelId,
                            autoLeave: false,
                        });

                        if (typeof guildPlayer.setAutoLeave === "function") {
                            guildPlayer.setAutoLeave(false);
                        }

                        if (!guildPlayer.connected) await guildPlayer.connect();
                    } catch (err) {
                        log.error(`Error auto-reconnecting 24/7 player in guild ${guildId}:`, err);
                    }
                }
            }
        } catch (err) {
            log.error("Error processing 24/7 reconnects on nodeConnected:", err);
        }

        // 2. Clean orphan song-request setup records if channels or guilds were deleted
        try {
            let setupList = await client.database.getSetup();
            if (setupList && setupList.length > 0) {
                for (const setupData of setupList) {
                    const { guildId, textChannelId } = setupData;

                    let guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
                    if (!guild) {
                        await client.database.deleteSetup(guildId).catch(() => null);
                        continue;
                    }

                    let textChannel = guild.channels.cache.get(textChannelId) || await guild.channels.fetch(textChannelId).catch(() => null);
                    if (!textChannel) {
                        await client.database.deleteSetup(guildId).catch(() => null);
                        continue;
                    }
                }
            }
        } catch (err) {
            log.error("Error cleaning orphan setup records on nodeConnected:", err);
        }
    }
};
