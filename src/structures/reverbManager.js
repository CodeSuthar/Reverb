const {
    Manager: nodeLinkManager,
    validate
} = require("moonlink.js");
const {
    Client: lyricsClient
} = require("lrclib-api");
const reverbPlayerManager = require("./reverbPlayerManager.js");
const {
    readdirSync
} = require("fs");
const logger = require("../utils/logger");

class reverbManager extends nodeLinkManager {
    constructor(client, config) {
        super({
            nodes: client.config.music.nodes,
            options: {
                clientName: `${client.config.bot.name} (${client.package.version})`,
                userAgent: `reverbMusicManager (${client.package.version})`,
                defaultPlayer: {
                    volume: client.config.music.defaultVolume || 100,
                    selfDeaf: true,
                    selfMute: false,
                },
                voiceConnection: {
                    timeout: 15000,
                    maxReconnectAttempts: 5,
                    reconnectDelay: 1000,
                    autoReconnect: true
                },
                node: {
                    selectionStrategy: "leastLoad",
                    retryDelay: 2000,
                    retryAmount: 5,
                    autoMovePlayers: true
                },
                search: {
                    defaultPlatform: "youtubemusic",
                    results: 10
                },
                playerDestruction: {
                    autoDestroyOnIdle: true,
                    idleTimeout: 5 * 60 * 1000
                },
                trackHandling: {
                    trackStuckThreshold: 30 * 1000,
                    retryFailedTracks: true,
                    maxRetryAttempts: 3
                }
            },
            ...config
        });
        this.players = new reverbPlayerManager(this);
        this.client = client;

        this.lyricsClient = new lyricsClient({
            clientName: `${client.config.bot.name} (${client.package.version})`,
        });

        this._loadManagerEvents();
    }

    async _loadManagerEvents() {
        let count = 0;
        const log = this.client?.logger || logger;

        const musicPath = "./src/events/music/";
        const eventDirectories = readdirSync(musicPath, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        if (!eventDirectories.length) {
            log.warn("No music event directories found!");
            return;
        }

        for (const directory of eventDirectories) {
            const directoryPath = `${musicPath}${directory}`;

            let eventFiles;

            try {
                eventFiles = readdirSync(directoryPath)
                    .filter((file) => file.endsWith(".js"));
            } catch (err) {
                log.error(`Failed to read directory ${directory}:`, err);
                continue;
            }

            if (!eventFiles.length) {
                log.warn(`No music event files found in directory: ${directory}`);
                continue;
            }

            for (const file of eventFiles) {
                try {
                    const event = require(`../events/music/${directory}/${file}`);

                    if (!event.name || typeof event.run !== "function") {
                        log.warn(`Invalid event module: ${directory}/${file}`);
                        continue;
                    }

                    this.on(event.name, event.run.bind(null, this.client));
                    log.music(`Loaded music event: ${event.name} from ${file} (${directory})`);
                    count++;
                } catch (err) {
                    log.error(`Error loading music event ${directory}/${file}:`, err);
                }
            }
        }

        log.success(`Successfully loaded ${count} music events`);
    }
};

module.exports = reverbManager;
