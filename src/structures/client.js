const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
} = require("discord.js");
const reverbLavalinkManager = require("./reverbLavalinkManager.js");

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
        this.commands = new Collection();
        this.aliases = new Collection();
        this.slashCommands = new Collection();
        this.cooldowns = new Collection();
        this.config = require("../config.reverb.js");
        this.prefix = this.config.bot.prefix;
        this.developerIds = this.config.bot.developerIds;
        this.emojiList = this.config.emojis;
    }

    _loadMusicManager() {
        this.musicManager = new reverbLavalinkManager(this);
    }

    _loadRestManager() {
        this.rest.on("rateLimited", (info) => {
            console.log("[ Rate Limited Log ]" + info);
        });
    }

    _loadHandler() {
        let handlers = [
            "clientEvents",
            "commands",
            "slashCommands",
            "connectDB",
            "errors"
        ]

        for (const handler of handlers) {
            try {
                require(`../handler/${handler}`)(this);
                console.log(`[ HANDLER ] Loaded ${handler} system`);
            } catch (e) {
                console.log(
                    `[ HANDLER ] Error found in handler called ${handler}\n${e}]`,
                );
            }
        }
    }

    async build() {
        this._loadHooks();
        this._loadMusicManager();
        this._loadRestManager();
        this._loadHandler();

        this.on("raw", (d) => this.musicManager.sendRawData(d));
    }

    async deploy() {
        await super.login(this.config.bot.token);
    }
};
