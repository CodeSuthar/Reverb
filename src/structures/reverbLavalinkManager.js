const {
    LavalinkManager,
    DebugEvents,
    safeStringify,
} = require("lavalink-client");
const reverbLavalinkPlayer = require("./reverbLavalinkPlayer.js");
const youtubeMusic = require("./youtubeMusic.js");
const { readdirSync } = require("fs");

class reverbLavalinkManager extends LavalinkManager {
    constructor(client, options = {}) {
        super({
            playerClass: reverbLavalinkPlayer,
            client: {
                id: client.config.clientId,
                username: client.config.name
            },
            nodes: client.config.lavalink.nodes,
            sendToShard: async (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
            autoSkip: true,
            autoSkipOnResolveError: true,
            autoMove: true,
            queueOptions: {
                maxPreviousTracks: 100
            },
            ...options
        });
        this.youtubeMusicInstance = new youtubeMusic(this);
        this.client = client;

        this.youtubeMusicInstance.warmup();

        this._loadNodeEvents();
        this._loadLavalinkEvents();
    }

    getPlayer(guildId) {
        return super.getPlayer(guildId);
    }

    createPlayer(options) {
        const oldPlayer = this.getPlayer(options.guildId);
        if (oldPlayer) return oldPlayer;

        const newPlayer = new this.options.playerClass(options, this, true);
        this.players.set(newPlayer.guildId, newPlayer);
        this.emit("playerCreate", newPlayer);
        return newPlayer;
    }

    destroyPlayer(guildId, destroyReason) {
        const oldPlayer = this.getPlayer(guildId);
        if (!oldPlayer) return;

        return oldPlayer.destroy(destroyReason);
    }

    deletePlayer(guildId) {
        const oldPlayer = this.getPlayer(guildId);
        if (!oldPlayer) return;

        if (
            typeof oldPlayer.voiceChannelId === "string" &&
            oldPlayer.connected &&
            !oldPlayer.getData("internal_destroywithoutdisconnect")
        ) {
            if (!this.options?.advancedOptions?.debugOptions?.playerDestroy?.dontThrowError)
                throw new Error(
                    `Use Player#destroy() not LavalinkManager#deletePlayer() to stop the Player ${safeStringify(oldPlayer.toJSON?.())}`,
                );

            this._emitDebugEvent(DebugEvents.PlayerDeleteInsteadOfDestroy, {
                state: "warn",
                message: "Use Player#destroy() not LavalinkManager#deletePlayer() to stop the Player",
                functionLayer: "LavalinkManager > deletePlayer()",
            });
        }

        return this.players.delete(guildId);
    }

    async _loadNodeEvents() {
        let count = 0;
        const dir = readdirSync("./src/events/node/").filter((f) =>
            f.endsWith(".js"),
        );
        if (!dir.length) console.warn(`[ EVENTS ] No Node event files found!`);

        for (const file of dir) {
            try {
                const event = require(`../events/node/${file}`);
                this.nodeManager.on(event.name, event.run.bind(null));
                console.log(`[ EVENTS ] Node event loaded: ${event.name}`);
                count++;
            } catch (err) {
                console.error(`[ EVENTS ] Error loading Node event ${file}: ${err}`);
            }
        }
    }

    async _loadLavalinkEvents() {
        let count = 0;
        const dir = readdirSync("./src/events/lavalink/").filter((f) =>
            f.endsWith(".js"),
        );
        if (!dir.length) console.warn(`[ EVENTS ] No Lavalink event files found!`);

        for (const file of dir) {
            try {
                const event = require(`../events/lavalink/${file}`);
                this.on(event.name, event.run.bind(null, this.client));
                console.log(`[ EVENTS ] Lavalink event loaded: ${event.name}`);
                count++;
            } catch (err) {
                console.error(`[ EVENTS ] Error loading Lavalink event ${file}: ${err}`);
            }
        }
    }
};

module.exports = reverbLavalinkManager;