const {
    Pool
} = require("pg");
const {
    drizzle
} = require("drizzle-orm/node-postgres");
const schemas = require("../schemas/postgres");

const botRepository = require("../repositories/botRepository");
const guildRepository = require("../repositories/guildRepository");
const djRepository = require("../repositories/djRepository");
const stayRepository = require("../repositories/stayRepository");
const playlistRepository = require("../repositories/playlistRepository");
const setupRepository = require("../repositories/setupRepository");
const whitelistRepository = require("../repositories/whitelistRepository");

class PostgresProvider {
    /**
     * @param {Object} options
     * @param {string} options.url
     * @param {boolean} [options.ssl]
     * @param {string} [options.defaultPrefix="r!"]
     */
    constructor(options) {
        this.type = "postgres";
        this.options = options;
        this.defaultPrefix = options.defaultPrefix || require("../../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = options.defaultVolume ?? 100;
        this.pool = null;
        this.db = null;
        this.repositories = {};
    }

    async connect() {
        const poolConfig = {
            connectionString: this.options.url,
        };
        if (this.options.ssl) {
            poolConfig.ssl = { rejectUnauthorized: false };
        }

        this.pool = new Pool(poolConfig);
        this.db = drizzle(this.pool, { schema: schemas });

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
        const client = await this.pool.connect();
        try {
            await client.query(`
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
                    "roles" text DEFAULT '[]' NOT NULL
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
                ALTER TABLE "Playlist" ADD COLUMN IF NOT EXISTS "isPrivate" integer DEFAULT 0;
            `);
        } finally {
            client.release();
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

module.exports = PostgresProvider;
