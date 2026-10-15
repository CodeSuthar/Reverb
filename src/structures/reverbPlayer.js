const { Player } = require("lavalink-client");

/**
 * A custom player class for the reverb bot.
 */
class reverbLavalinkPlayer extends Player {
    constructor(...args) {
        super(...args);

        this.client = this.LavalinkManager.client;

        this._resolveChannels().catch((err) => {
            console.error(`[ PLAYER ] Error resolving channels for player: ${err}`);
        });
    }

    createPlayer(options) {
        const oldPlayer = this.getPlayer(options.guildId);
        if (oldPlayer) return oldPlayer;

        const newPlayer = new this.options.playerClass(options, this, true);
        this.players.set(newPlayer.guildId, newPlayer);
        this.emit("playerCreate", newPlayer);
        return newPlayer;
    }

    /**
     * Fetches the text and voice channels for the player.
     */
    async _resolveChannels() {
        if (!this.client) {
            throw new Error("[ PLAYER ] Client instance is not available.");
        }

        let guild = this.client.guilds.cache.get(this.guildId) || await this.client.guilds.fetch(this.guildId).catch(() => null);

        if (guild) {
            let textChannel = guild.channels.cache.get(this.textChannelId) || await guild.channels.fetch(this.textChannelId).catch(() => null);
            let voiceChannel = guild.channels.cache.get(this.voiceChannelId) || await guild.channels.fetch(this.voiceChannelId).catch(() => null);

            if (textChannel) {
                this.textChannel = textChannel;
            }

            if (voiceChannel) {
                this.voiceChannel = voiceChannel;
            }
        }
    }
}

module.exports = reverbLavalinkPlayer;