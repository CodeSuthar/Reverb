const mysql = require("mysql2/promise");
const { drizzle } = require("drizzle-orm/mysql2");
const schemas = require("../schemas/mysql");

const botRepository = require("../repositories/botRepository");
const guildRepository = require("../repositories/guildRepository");
const djRepository = require("../repositories/djRepository");
const stayRepository = require("../repositories/stayRepository");
const playlistRepository = require("../repositories/playlistRepository");
const setupRepository = require("../repositories/setupRepository");
const whitelistRepository = require("../repositories/whitelistRepository");

class MySQLProvider {
    /**
     * @param {Object} options
     * @param {string} [options.url]
     * @param {string} [options.host]
     * @param {number} [options.port]
     * @param {string} [options.user]
     * @param {string} [options.password]
     * @param {string} [options.database]
     * @param {string} [options.defaultPrefix="r!"]
     */
    constructor(options) {
        this.type = "mysql";
        this.options = options;
        this.defaultPrefix = options.defaultPrefix || require("../../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = options.defaultVolume ?? 100;
        this.pool = null;
        this.db = null;
        this.repositories = {};
    }

    async connect() {
        const connectionConfig = this.options.url
            ? { uri: this.options.url }
            : {
                host: this.options.host || "localhost",
                port: this.options.port || 3306,
                user: this.options.user || "root",
                password: this.options.password || "",
                database: this.options.database || "reverb",
            };

        this.pool = mysql.createPool(connectionConfig);
        this.db = drizzle(this.pool, { schema: schemas, mode: "default" });

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
        const conn = await this.pool.getConnection();
        try {
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Bot\` (
                    \`botId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`totalPlaySong\` int DEFAULT 0
                );
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Guild\` (
                    \`guildId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`prefix\` varchar(16) NOT NULL,
                    \`language\` varchar(32) DEFAULT 'EnglishUS',
                    \`defaultVolume\` int DEFAULT 100
                );
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Stay\` (
                    \`guildId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`textChannelId\` varchar(64) NOT NULL,
                    \`voiceChannelId\` varchar(64) NOT NULL
                );
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Dj\` (
                    \`guildId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`mode\` int DEFAULT 0 NOT NULL,
                    \`roles\` text
                );
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Playlist\` (
                    \`id\` varchar(64) PRIMARY KEY NOT NULL,
                    \`userId\` varchar(64) NOT NULL,
                    \`name\` varchar(128) NOT NULL,
                    \`tracks\` text,
                    \`isPrivate\` int DEFAULT 0,
                    UNIQUE KEY \`user_playlist_unique\` (\`userId\`, \`name\`)
                );
            `);
            try {
                await conn.query("ALTER TABLE \`Playlist\` ADD COLUMN \`isPrivate\` int DEFAULT 0;");
            } catch (_) {}
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Setup\` (
                    \`guildId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`parentChannelId\` varchar(64),
                    \`textChannelId\` varchar(64) NOT NULL,
                    \`voiceChannelId\` varchar(64),
                    \`messageId\` varchar(64) NOT NULL
                );
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`Whitelist\` (
                    \`guildId\` varchar(64) PRIMARY KEY NOT NULL,
                    \`mode\` int DEFAULT 0 NOT NULL,
                    \`channels\` text,
                    \`roles\` text,
                    \`users\` text
                );
            `);
        } finally {
            conn.release();
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

module.exports = MySQLProvider;
