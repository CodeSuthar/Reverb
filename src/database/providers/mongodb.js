const mongoose = require("mongoose");
const botRepository = require("../repositories/botRepository");
const guildRepository = require("../repositories/guildRepository");
const djRepository = require("../repositories/djRepository");
const stayRepository = require("../repositories/stayRepository");
const playlistRepository = require("../repositories/playlistRepository");
const setupRepository = require("../repositories/setupRepository");
const whitelistRepository = require("../repositories/whitelistRepository");

const BotModel = require("../models/mongodb/bot");
const GuildModel = require("../models/mongodb/guild");
const DjModel = require("../models/mongodb/dj");
const StayModel = require("../models/mongodb/stay");
const PlaylistModel = require("../models/mongodb/playlist");
const SetupModel = require("../models/mongodb/setup");

const WhitelistModel = require("../models/mongodb/whitelist");

class MongoProvider {
    /**
     * @param {Object} options
     * @param {string} options.uri
     * @param {Object} [options.options]
     * @param {string} [options.defaultPrefix="r!"]
     */
    constructor(options) {
        this.type = "mongodb";
        this.options = options;
        this.defaultPrefix = options.defaultPrefix || require("../../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = options.defaultVolume ?? 100;
        this.client = mongoose;

        const guildRepo = new guildRepository({
            type: "mongodb",
            model: GuildModel,

            defaultPrefix: this.defaultPrefix,
            defaultVolume: this.defaultVolume,
        });

        const djRepo = new djRepository({ type: "mongodb", model: DjModel, guildRepository: guildRepo });

        this.repositories = {
            bot: new botRepository({ type: "mongodb", model: BotModel }),
            guild: guildRepo,
            dj: djRepo,
            stay: new stayRepository({ type: "mongodb", model: StayModel, guildRepository: guildRepo }),
            playlist: new playlistRepository({ type: "mongodb", model: PlaylistModel }),
            setup: new setupRepository({ type: "mongodb", model: SetupModel, guildRepository: guildRepo }),
            whitelist: new whitelistRepository({ type: "mongodb", model: WhitelistModel, guildRepository: guildRepo }),
        };
    }

    async connect() {
        const uri = this.options.uri;
        const opts = this.options.options || {
            autoIndex: false,
            connectTimeoutMS: 10000,
            family: 4,
        };

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri, opts);
        }
    }

    async disconnect() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

module.exports = MongoProvider;
