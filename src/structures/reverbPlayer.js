const { Player } = require("moonlink.js");

class reverbPlayer extends Player {
    constructor(manager, node, config) {
        super(manager, node, config);

        this.client = manager.client;
        this.lyricsClient = manager.lyricsClient;

        this._playerData = new Map();

        this._resolveChannels().catch((err) => {
            (this.client?.logger || require("../utils/logger")).error(`Failed to resolve channels for player in guild ${this.guildId}:`, err);
        });
    }

    async setData(key, value) {
        this._playerData.set(key, value);
    }

    async getData(key) {
        return this._playerData.get(key);
    }

    async clearData(key) {
        this._playerData.delete(key);
    }

    async setTrackMessage(options) {
        if (!options || !options.messageId || !options.messageId) {
            throw new Error("Invalid options for setTrackMessage");
        }

        await this.setData(`trackMessage_${options.guildId}`, options.messageId);
    }

    async getTrackMessage(guildId) {
        return await this.getData(`trackMessage_${guildId}`);
    }

    async clearTrackMessage(guildId) {
        await this.clearData(`trackMessage_${guildId}`);
    }

    async setFairPlay() {
        let tracks = [...this.queue.tracks];
        let requesterMap = new Map();

        // Group tracks by requester
        for (let track of tracks) {
            let requesterId = track.requester?.id ?? "unknown";

            if (!requesterMap.has(requesterId)) {
                requesterMap.set(requesterId, []);
            }

            requesterMap.get(requesterId).push(track);
        }

        // Build fair queue
        let fairQueue = [];
        let requesterIndices = new Map();

        for (let requesterId of requesterMap.keys()) {
            requesterIndices.set(requesterId, 0);
        }

        let tracksAdded = 0;

        while (tracksAdded < tracks.length) {
            for (let [requesterId, trackList] of requesterMap.entries()) {
                let currentIndex = requesterIndices.get(requesterId);

                if (currentIndex < trackList.length) {
                    fairQueue.push(trackList[currentIndex]);
                    requesterIndices.set(requesterId, currentIndex + 1);
                    tracksAdded++;
                }
            }
        }

        this.queue.clear();
        this.queue.add(fairQueue);

        return fairQueue;
    }

    async _resolveChannels() {
        if (!this.client) {
            throw new Error(
                "[PLAYER] Client instance is not available.",
            );
        }

        const guild =
            this.client.guilds.cache.get(this.guildId) ??
            await this.client.guilds
                .fetch(this.guildId)
                .catch(() => null);

        const textChannel =
            guild.channels.cache.get(this.textChannelId) ??
            await guild.channels
                .fetch(this.textChannelId)
                .catch(() => null);

        const voiceChannel =
            guild.channels.cache.get(this.voiceChannelId) ??
            await guild.channels
                .fetch(this.voiceChannelId)
                .catch(() => null);

        if (guild) this.guild = guild;
        if (textChannel) this.textChannel = textChannel;
        if (voiceChannel) this.voiceChannel = voiceChannel;
    }
}

module.exports = reverbPlayer;