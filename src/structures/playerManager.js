const { LavalinkManager } = require("lavalink-client");
const reverbPlayer = require("./reverbPlayer.js");
const youtubeMusic = require("./youtubeMusic.js");
const { readdirSync } = require("fs");

class reverbLavalinkManager extends LavalinkManager {
    constructor(client, options = {}) {
        super({
            playerClass: reverbPlayer,
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
        this._loadEvents().catch((err) => {
            console.error(`[ PLAYER ] Error loading player events: ${err}`);
        });
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

    async _loadEvents() {
        let count = 0;
        const dir = readdirSync("./src/events/player/").filter((f) =>
            f.endsWith(".js"),
        );
        if (!dir.length) throw new Error(`[ EVENTS ] No player event files found!`);

        for (const file of dir) {
            try {
                const event = require(`../events/player/${file}`);
                this.on(event.name, event.run.bind(null, this.client));
                console.log(`[ EVENTS ] Player event loaded: ${event.name}`);
                count++;
            } catch (err) {
                console.error(`[ EVENTS ] Error loading player event ${file}: ${err}`);
            }
        }

        console.log(`[ EVENTS ] ${count} Player events loaded.`);

        this.nodeManager.on("create", (node) => {
            console.log(`[ LAVALINK ] Created node: ${node.id}`);
        });

        this.nodeManager.on("connect", (node) => {
            console.log(`[ LAVALINK ] Connected: ${node.id}`);
        });

        this.nodeManager.on("error", (node, error, payload) => {
            console.error(`[ LAVALINK ] Node error: ${node.id}`);
            console.error("Message:", error?.message);
            console.error("Error:", error);

            if (payload) {
                console.error("Payload:", payload);
            }
        });

        this.nodeManager.on("disconnect", (node, reason) => {
            console.error(`[ LAVALINK ] Disconnected: ${node.id}`);
            console.error("Reason:", reason);
        });

        this.nodeManager.on("reconnecting", (node) => {
            console.warn(`[ LAVALINK ] Reconnecting: ${node.id}`);
        });

        this.nodeManager.on("reconnectinprogress", (node) => {
            console.warn(`[ LAVALINK ] Reconnection started: ${node.id}`);
        });

    }
};

module.exports = reverbLavalinkManager;