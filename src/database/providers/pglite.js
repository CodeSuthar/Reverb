const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const path = require("path");
const fs = require("fs");
const schemas = require("../schemas/postgres");

const botRepository = require("../repositories/botRepository");
const guildRepository = require("../repositories/guildRepository");
const djRepository = require("../repositories/djRepository");
const stayRepository = require("../repositories/stayRepository");
const playlistRepository = require("../repositories/playlistRepository");
const setupRepository = require("../repositories/setupRepository");
const whitelistRepository = require("../repositories/whitelistRepository");

class PGLiteProvider {
    /**
     * @param {Object} options
     * @param {string} options.dataDir
     * @param {string} [options.defaultPrefix="r!"]
     */
    constructor(options) {
        this.type = "pglite";
        this.options = options;
        this.defaultPrefix = options.defaultPrefix || require("../../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = options.defaultVolume ?? 100;
        this.client = null;
        this.db = null;
        this.repositories = {};
    }

    async connect() {
        const dataDir = this.options.dataDir || "./data/reverb-pgdata";

        if (dataDir && !dataDir.startsWith("memory://")) {
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }

        this.client = new PGlite(dataDir);
        await this.client.waitReady;

        this.db = drizzle(this.client, { schema: schemas });

        // Auto-create tables if they don't exist
        await this._initTables();

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

    async _initTables() {
        await this.client.exec(`
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
                "isPrivate" boolean DEFAULT false NOT NULL
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
            await this.client.exec('ALTER TABLE "Playlist" ADD COLUMN IF NOT EXISTS "isPrivate" boolean DEFAULT false NOT NULL;');
        } catch (_) {}

        try {
            await this.client.exec('ALTER TABLE "Dj" ADD COLUMN IF NOT EXISTS "users" text DEFAULT \'[]\' NOT NULL;');
        } catch (_) {}
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }
}

module.exports = PGLiteProvider;
