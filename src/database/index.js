const DatabaseManager = require("./DatabaseManager");
const { DatabaseType } = require("./types");

// Providers
const MongoProvider = require("./providers/mongodb");
const PostgresProvider = require("./providers/postgres");
const MySQLProvider = require("./providers/mysql");
const SQLiteProvider = require("./providers/sqlite");
const PGLiteProvider = require("./providers/pglite");

// Repositories
const botRepository = require("./repositories/botRepository");
const guildRepository = require("./repositories/guildRepository");
const djRepository = require("./repositories/djRepository");
const stayRepository = require("./repositories/stayRepository");
const playlistRepository = require("./repositories/playlistRepository");
const setupRepository = require("./repositories/setupRepository");
const whitelistRepository = require("./repositories/whitelistRepository");

// Schemas
const postgresSchemas = require("./schemas/postgres");
const sqliteSchemas = require("./schemas/sqlite");
const mysqlSchemas = require("./schemas/mysql");

/**
 * Factory function to create a DatabaseManager instance
 * @param {Object} [config]
 * @param {any} [client]
 * @returns {DatabaseManager}
 */
function createDatabase(config, client) {
    return new DatabaseManager(config, client);
}

module.exports = {
    DatabaseManager,
    DatabaseType,
    createDatabase,

    // Providers
    MongoProvider,
    PostgresProvider,
    MySQLProvider,
    SQLiteProvider,
    PGLiteProvider,

    // Repositories
    botRepository,
    guildRepository,
    djRepository,
    stayRepository,
    playlistRepository,
    setupRepository,
    whitelistRepository,

    // Aliases
    BotRepository: botRepository,
    GuildRepository: guildRepository,
    DjRepository: djRepository,
    StayRepository: stayRepository,
    PlaylistRepository: playlistRepository,
    SetupRepository: setupRepository,
    WhitelistRepository: whitelistRepository,

    // Schemas
    postgresSchemas,
    sqliteSchemas,
    mysqlSchemas,
};
