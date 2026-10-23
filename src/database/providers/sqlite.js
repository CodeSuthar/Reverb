const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const path = require("path");
const fs = require("fs");
const schemas = require("../schemas/sqlite");

const botRepository = require("../repositories/botRepository");
const guildRepository = require("../repositories/guildRepository");
const djRepository = require("../repositories/djRepository");
const stayRepository = require("../repositories/stayRepository");
const playlistRepository = require("../repositories/playlistRepository");
const setupRepository = require("../repositories/setupRepository");
const whitelistRepository = require("../repositories/whitelistRepository");

class SQLiteProvider {
    /**
     * @param {Object} options
     * @param {string} options.path
     * @param {string} [options.defaultPrefix="r!"]
     */
    constructor(options) {
        this.type = "sqlite";
        this.options = options;
        this.defaultPrefix = options.defaultPrefix || require("../../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = options.defaultVolume ?? 100;
        this.sqlite = null;
        this.db = null;
        this.repositories = {};

        this._setup();
    }

    _setup() {
        const filePath = this.options.path || "./data/reverb.db";

        if (filePath !== ":memory:") {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        this.sqlite = new Database(filePath);
        this.sqlite.pragma("journal_mode = WAL");
        this.sqlite.pragma("foreign_keys = ON");

        this.db = drizzle(this.sqlite, { schema: schemas });
        this._initTables();

        const guildRepo = new guildRepository({
            type: "sql",
            db: this.db,
            table: schemas.guild,
            defaultPrefix: this.defaultPrefix,
            defaultVolume: this.defaultVolume,
        });

        const djRepo = new djRepository({ type: "sql", db: this.db, table: schemas.dj, guildRepository: guildRepo });

        this.repositories = {
            bot: new botRepository({ type: "sql", db: this.db, table: schemas.bot }),
            guild: guildRepo,
            dj: djRepo,
            stay: new stayRepository({ type: "sql", db: this.db, table: schemas.stay, guildRepository: guildRepo }),
            playlist: new playlistRepository({ type: "sql", db: this.db, table: schemas.playlist }),
            setup: new setupRepository({ type: "sql", db: this.db, table: schemas.setup, guildRepository: guildRepo }),
            whitelist: new whitelistRepository({ type: "sql", db: this.db, table: schemas.whitelist, guildRepository: guildRepo }),
        };
    }

    _initTables() {
        this.sqlite.exec(`
            CREATE TABLE IF NOT EXISTS "Bot" (
                "botId" text PRIMARY KEY NOT NULL,
                "totalPlaySong" integer DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS "Guild" (
                "guildId" text PRIMARY KEY NOT NULL,
                "prefix" text NOT NULL,
                "language" text DEFAULT 'EnglishUS',
                "defaultVolume" integer DEFAULT 100
            );
            CREATE TABLE IF NOT EXISTS "Stay" (
                "guildId" text PRIMARY KEY NOT NULL,
                "textChannelId" text NOT NULL,
                "voiceChannelId" text NOT NULL
            );
            CREATE TABLE IF NOT EXISTS "Dj" (
                "guildId" text PRIMARY KEY NOT NULL,
                "mode" integer DEFAULT 0 NOT NULL,
                "roles" text DEFAULT '[]' NOT NULL,
                "users" text DEFAULT '[]' NOT NULL
            );
            CREATE TABLE IF NOT EXISTS "Playlist" (
                "id" text PRIMARY KEY NOT NULL,
                "userId" text NOT NULL,
                "name" text NOT NULL,
                "tracks" text,
                "isPrivate" integer DEFAULT 0
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "user_playlist_unique" ON "Playlist" ("userId", "name");
            CREATE TABLE IF NOT EXISTS "Setup" (
                "guildId" text PRIMARY KEY NOT NULL,
                "parentChannelId" text,
                "textChannelId" text NOT NULL,
                "voiceChannelId" text,
                "messageId" text NOT NULL
            );
            CREATE TABLE IF NOT EXISTS "Whitelist" (
                "guildId" text PRIMARY KEY NOT NULL,
                "mode" integer DEFAULT 0 NOT NULL,
                "channels" text DEFAULT '[]' NOT NULL,
                "roles" text DEFAULT '[]' NOT NULL,
                "users" text DEFAULT '[]' NOT NULL
            );
        `);

        try {
            this.sqlite.exec('ALTER TABLE "Playlist" ADD COLUMN "isPrivate" integer DEFAULT 0;');
        } catch (_) {}

        try {
            this.sqlite.exec('ALTER TABLE "Dj" ADD COLUMN "users" text DEFAULT \'[]\' NOT NULL;');
        } catch (_) {}
    }

    async connect() {
        if (!this.sqlite) {
            this._setup();
        }
    }

    async disconnect() {
        if (this.sqlite) {
            this.sqlite.close();
            this.sqlite = null;
        }
    }
}

module.exports = SQLiteProvider;
