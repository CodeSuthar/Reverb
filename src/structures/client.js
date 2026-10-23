const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
} = require("discord.js");
const reverbManager = require("./reverbManager.js");
const DatabaseManager = require("../database/DatabaseManager");

module.exports = class ReverbClient extends Client {
    constructor() {
        super({
            shards: "auto",
            failIfNotExists: true,
            allowedMentions: {
                parse: [],
                repliedUser: false,
            },
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.User
            ],
        });
    }

    _loadHooks() {
        this.logger = require("../utils/logger");
        this.commands = new Collection();
        this.aliases = new Collection();
        this.slashCommands = new Collection();
        this.config = require("../../config.reverb.js");
        this.name = this.config?.bot?.name || "Reverb";
        this.prefix = this.config.bot.prefix;
        this.developerIds = this.config.bot.developerIds;
        this.showDeveloperCommandsInHelp = this.config?.bot?.showDeveloperCommandsInHelp ?? this.config?.help?.showDeveloperCommands ?? false;
        this.emojiList = this.config.emojis;
        this.package = require("../../package.json");

        const rawColor = this.config?.bot?.main ?? this.config?.bot?.mainColor ?? "#FF66C4";
        let hex = "#FF66C4";
        let number = 0xFF66C4;

        if (typeof rawColor === "number") {
            number = rawColor;
            hex = "#" + rawColor.toString(16).padStart(6, "0").toUpperCase();
        } else if (typeof rawColor === "string") {
            const clean = rawColor.trim();
            if (clean.startsWith("#")) {
                hex = clean;
                number = parseInt(clean.slice(1), 16);
            } else if (clean.startsWith("0x") || clean.startsWith("0X")) {
                number = parseInt(clean, 16);
                hex = "#" + clean.slice(2).padStart(6, "0").toUpperCase();
            } else {
                number = parseInt(clean, 16);
                hex = "#" + clean.padStart(6, "0").toUpperCase();
            }
        }

        if (isNaN(number)) {
            number = 0xFF66C4;
            hex = "#FF66C4";
        }

        this.color = {
            hex: hex,
            number: number,
            main: hex,
        };
        this.mainColor = number;
    }

    get botName() {
        return this.config?.bot?.name || this.user?.username || "Reverb";
    }

    async _loadDatabase() {
        try {
            if (!this.database) {
                this.database = new DatabaseManager(this.config.database, this);
            }
            await this.database.connect();
            this.logger.success(`[ DATABASE ] ${this.database.type.toUpperCase()} database connected successfully`);
        } catch (err) {
            this.logger.error(`[ DATABASE ] Database connection error (${this.database?.type || "unknown"}):`, err);
        }
    }

    _loadMusicManager() {
        this.musicManager = new reverbManager(this, {
            send: (guildId, payload) => this.guilds.cache.get(guildId)?.shard?.send(payload),
        });
    }

    _loadRestManager() {
        this.rest.on("rateLimited", (info) => {
            this.logger.rest("Rate limited:", info);
        });
    }

    _loadHandler() {
        let handlers = [
            "clientEvents",
            "commands",
            "slashCommands",
            "errors"
        ];

        for (const handler of handlers) {
            try {
                require(`../handler/${handler}`)(this);
                this.logger.handler(`Loaded ${handler} system`);
            } catch (e) {
                this.logger.error(`Error found in handler called ${handler}:`, e);
            }
        }
        this.logger.success(`Successfully initialized all ${handlers.length} core handler systems`);
    }

    async build() {
        this._loadHooks();
        await this._loadDatabase();
        this._loadMusicManager();
        this._loadRestManager();
        this._loadHandler();
    }

    async deploy() {
        await super.login(this.config.bot.token);
    }

    async destroy() {
        if (this.database) {
            try {
                await this.database.disconnect();
                this.logger.success("[ DATABASE ] Disconnected cleanly during client destroy.");
            } catch (e) {
                this.logger.error("[ DATABASE ] Error disconnecting during client destroy:", e);
            }
        }
        return super.destroy();
    }
};
