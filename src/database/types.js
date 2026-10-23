/**
 * @file Database Types & Contracts
 * Contains JSDoc type definitions and runtime constants for Reverb's database layer.
 */

/**
 * Supported database provider types.
 * @readonly
 * @enum {string}
 */
const DatabaseType = {
    MongoDB: "mongodb",
    Postgres: "postgres",
    MySQL: "mysql",
    SQLite: "sqlite",
    PGLite: "pglite",
};

/**
 * @typedef {Object} Bot
 * @property {string} botId
 * @property {number} totalPlaySong
 */

/**
 * @typedef {Object} Guild
 * @property {string} guildId
 * @property {string} prefix
 * @property {string} language
 * @property {number} defaultVolume
 */

/**
 * @typedef {Object} Stay
 * @property {string} guildId
 * @property {string} textChannelId
 * @property {string} voiceChannelId
 * @property {string} [textId]
 * @property {string} [voiceId]
 */

/**
 * @typedef {Object} Dj
 * @property {string} guildId
 * @property {boolean} mode
 * @property {string[]} roles
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string[]} tracks
 * @property {boolean} [isPrivate]
 */

/**
 * @typedef {Object} Setup
 * @property {string} guildId
 * @property {string|null} parentChannelId
 * @property {string} textChannelId
 * @property {string|null} voiceChannelId
 * @property {string} messageId
 * @property {string} [textId]
 */

/**
 * @typedef {Object} Whitelist
 * @property {string} guildId
 * @property {boolean} mode
 * @property {string[]} channels
 * @property {string[]} roles
 * @property {string[]} users
 */

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} provider
 * @property {string} [url]
 * @property {Object} [mongodb]
 * @property {string} mongodb.uri
 * @property {Object} [mongodb.options]
 * @property {Object} [postgres]
 * @property {string} postgres.url
 * @property {boolean} [postgres.ssl]
 * @property {Object} [mysql]
 * @property {string} [mysql.url]
 * @property {string} [mysql.host]
 * @property {number} [mysql.port]
 * @property {string} [mysql.user]
 * @property {string} [mysql.password]
 * @property {string} [mysql.database]
 * @property {Object} [sqlite]
 * @property {string} sqlite.path
 * @property {Object} [pglite]
 * @property {string} pglite.dataDir
 */

/**
 * @typedef {Object} IBotRepository
 * @property {(botId: string) => Promise<Bot>} get
 * @property {(botId: string, count?: number) => Promise<number>} incrementSongsPlayed
 */

/**
 * @typedef {Object} IGuildRepository
 * @property {(guildId: string) => Promise<Guild>} get
 * @property {(guildId: string, prefix: string) => Promise<void>} setPrefix
 * @property {(guildId: string) => Promise<string>} getPrefix
 * @property {(guildId: string, language: string) => Promise<void>} updateLanguage
 * @property {(guildId: string) => Promise<string>} getLanguage
 * @property {(guildId: string, volume: number) => Promise<void>} setDefaultVolume
 * @property {(guildId: string) => Promise<number>} getDefaultVolume
 * @property {(guildId: string) => Promise<boolean>} delete
 */

/**
 * @typedef {Object} ISetupRepository
 * @property {(guildId: string) => Promise<Setup | null>} get
 * @property {(guildId: string, dataOrTextChannelId: any, messageId?: string, parentChannelId?: string, voiceChannelId?: string) => Promise<void>} set
 * @property {(guildId: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} IStayRepository
 * @property {(guildId: string) => Promise<Stay | null>} get
 * @property {() => Promise<Stay[]>} getAll
 * @property {(guildId: string, textChannelId: string, voiceChannelId: string) => Promise<void>} set
 * @property {(guildId: string) => Promise<void>} delete
 */

/**
 * @typedef {Object} IDjRepository
 * @property {(guildId: string) => Promise<Dj>} get
 * @property {(guildId: string, mode: boolean) => Promise<void>} setMode
 * @property {(guildId: string, roleId: string) => Promise<void>} addRole
 * @property {(guildId: string, roleId: string) => Promise<void>} removeRole
 * @property {(guildId: string) => Promise<void>} clearRoles
 * @property {(guildId: string) => Promise<string[]>} getRoles
 */

/**
 * @typedef {Object} IPlaylistRepository
 * @property {(userId: string, name: string) => Promise<Playlist | null>} get
 * @property {(userId: string) => Promise<Playlist[]>} getUserPlaylists
 * @property {(userId: string, name: string) => Promise<void>} create
 * @property {(userId: string, name: string, tracks: string[]) => Promise<void>} createWithTracks
 * @property {(userId: string, name: string) => Promise<void>} delete
 * @property {(userId: string, name: string) => Promise<void>} clearTracks
 * @property {(userId: string, name: string, tracks: string[]) => Promise<void>} addTracks
 * @property {(userId: string, name: string, encodedSong: string) => Promise<void>} removeTrack
 * @property {(userId: string, name: string) => Promise<string[] | null>} getTracks
 */

/**
 * @typedef {Object} IWhitelistRepository
 * @property {(guildId: string) => Promise<Whitelist>} get
 * @property {(guildId: string, mode: boolean) => Promise<void>} setMode
 * @property {(guildId: string) => Promise<boolean>} toggle
 * @property {(guildId: string, channelId: string) => Promise<boolean>} addChannel
 * @property {(guildId: string, channelId: string) => Promise<boolean>} removeChannel
 * @property {(guildId: string) => Promise<void>} clearChannels
 * @property {(guildId: string, roleId: string) => Promise<boolean>} addRole
 * @property {(guildId: string, roleId: string) => Promise<boolean>} removeRole
 * @property {(guildId: string) => Promise<void>} clearRoles
 * @property {(guildId: string, userId: string) => Promise<boolean>} addUser
 * @property {(guildId: string, userId: string) => Promise<boolean>} removeUser
 * @property {(guildId: string) => Promise<void>} clearUsers
 * @property {(guildId: string) => Promise<void>} clearAll
 */

/**
 * @typedef {Object} Repositories
 * @property {IBotRepository} bot
 * @property {IGuildRepository} guild
 * @property {ISetupRepository} setup
 * @property {IStayRepository} stay
 * @property {IDjRepository} dj
 * @property {IPlaylistRepository} playlist
 * @property {IWhitelistRepository} whitelist
 */

/**
 * @typedef {Object} IDatabaseProvider
 * @property {DatabaseType} type
 * @property {any} client
 * @property {Repositories} repositories
 * @property {() => Promise<void>} connect
 * @property {() => Promise<void>} disconnect
 */

module.exports = {
    DatabaseType,
};
