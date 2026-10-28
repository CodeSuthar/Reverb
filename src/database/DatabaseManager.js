const {
    DatabaseType
} = require("./types");

const MongoProvider = require("./providers/mongodb");
const PostgresProvider = require("./providers/postgres");
const MySQLProvider = require("./providers/mysql");
const SQLiteProvider = require("./providers/sqlite");
const PGLiteProvider = require("./providers/pglite");

class DatabaseManager {
    /**
     * @param {Object} [config] Database configuration
     * @param {any} [client] Bot client instance
     */
    constructor(config = {}, client = null) {
        this.config = config;
        this.client = client;
        this.defaultPrefix = client?.prefix || config?.defaultPrefix || require("../../config.reverb.js")?.bot?.prefix || "r!";
        this.defaultVolume = client?.config?.music?.defaultVolume ?? config?.music?.defaultVolume ?? 100;
        this.type = this._resolveProviderType(config);
        this.provider = this._createProvider(this.type, config);
        this.connected = false;
    }

    /**
     * Resolves the database provider type from configuration
     * @private
     * @param {Object} config
     * @returns {string}
     */
    _resolveProviderType(config) {
        if (config.provider) {
            const normalized = String(config.provider).toLowerCase();
            if (Object.values(DatabaseType).includes(normalized)) {
                return normalized;
            }
        }

        // Auto-detection based on connection URL
        const url = config.url || "";
        if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
            return DatabaseType.Postgres;
        }
        if (url.startsWith("mysql://")) {
            return DatabaseType.MySQL;
        }
        if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://") || config.mongoURI) {
            return DatabaseType.MongoDB;
        }
        if (url.startsWith("sqlite:") || url.endsWith(".db") || url.endsWith(".sqlite")) {
            return DatabaseType.SQLite;
        }

        return DatabaseType.SQLite;
    }

    /**
     * Instantiates the requested provider
     * @private
     * @param {string} type
     * @param {Object} config
     */
    _createProvider(type, config) {
        const prefix = this.defaultPrefix;
        const volume = this.defaultVolume;

        switch (type) {
            case DatabaseType.MongoDB:
                return new MongoProvider({
                    uri: config.mongodb?.uri || config.url || config.mongoURI,
                    options: config.mongodb?.options,
                    defaultPrefix: prefix,
                    defaultVolume: volume,
                });

            case DatabaseType.Postgres:
                return new PostgresProvider({
                    url: config.postgres?.url || config.url,
                    ssl: config.postgres?.ssl,
                    defaultPrefix: prefix,
                    defaultVolume: volume,
                });

            case DatabaseType.MySQL:
                return new MySQLProvider({
                    url: config.mysql?.url || config.url,
                    host: config.mysql?.host,
                    port: config.mysql?.port,
                    user: config.mysql?.user,
                    password: config.mysql?.password,
                    database: config.mysql?.database,
                    defaultPrefix: prefix,
                    defaultVolume: volume,
                });

            case DatabaseType.SQLite:
                return new SQLiteProvider({
                    path: config.sqlite?.path || "./data/reverb.db",
                    defaultPrefix: prefix,
                    defaultVolume: volume,
                });

            case DatabaseType.PGLite:
                return new PGLiteProvider({
                    dataDir: config.pglite?.dataDir || "./data/reverb-pgdata",
                    defaultPrefix: prefix,
                    defaultVolume: volume,
                });

            default:
                throw new Error(`[ DATABASE ] Unsupported database provider type: "${type}"`);
        }
    }

    /**
     * Connects to the database and initializes repositories
     */
    async connect() {
        if (this.connected) return;
        await this.provider.connect();
        this.connected = true;
    }

    /**
     * Disconnects from the database cleanly
     */
    async disconnect() {
        if (!this.connected) return;
        await this.provider.disconnect();
        this.connected = false;
    }

    // ============================================
    // Repository Accessors
    // ============================================

    get repositories() {
        return this.provider.repositories;
    }

    get bot() {
        return this.provider.repositories.bot;
    }

    get guild() {
        return this.provider.repositories.guild;
    }

    get dj() {
        return this.provider.repositories.dj;
    }

    get stay() {
        return this.provider.repositories.stay;
    }

    get playlist() {
        return this.provider.repositories.playlist;
    }

    get setup() {
        return this.provider.repositories.setup;
    }

    get whitelist() {
        return this.provider.repositories.whitelist;
    }

    // ============================================
    // High-Level Shorthand / Facade Methods
    // ============================================

    // Guild
    async get(guildId) {
        return this.guild.get(guildId);
    }

    async getPrefix(guildId) {
        return this.guild.getPrefix(guildId);
    }

    async setPrefix(guildId, prefix) {
        return this.guild.setPrefix(guildId, prefix);
    }

    async getLanguage(guildId) {
        return this.guild.getLanguage(guildId);
    }

    async updateLanguage(guildId, language) {
        return this.guild.updateLanguage(guildId, language);
    }

    async getDefaultVolume(guildId) {
        return this.guild.getDefaultVolume(guildId);
    }

    async setDefaultVolume(guildId, volume) {
        return this.guild.setDefaultVolume(guildId, volume);
    }

    // DJ
    async getDj(guildId) {
        return this.dj.get(guildId);
    }

    async getDJ(guildId) {
        return this.dj.get(guildId);
    }

    async setDj(guildId, mode) {
        return this.dj.setMode(guildId, mode);
    }

    async setDJ(guildId, mode) {
        return this.dj.setMode(guildId, mode);
    }

    async addRole(guildId, roleId) {
        return this.dj.addRole(guildId, roleId);
    }

    async addDJRole(guildId, roleId) {
        return this.dj.addRole(guildId, roleId);
    }

    async removeRole(guildId, roleId) {
        return this.dj.removeRole(guildId, roleId);
    }

    async removeDJRole(guildId, roleId) {
        return this.dj.removeRole(guildId, roleId);
    }

    async clearRoles(guildId) {
        return this.dj.clearRoles(guildId);
    }

    async clearDJRoles(guildId) {
        return this.dj.clearRoles(guildId);
    }

    async getRoles(guildId) {
        return this.dj.getRoles(guildId);
    }

    async addUser(guildId, userId) {
        return this.dj.addUser(guildId, userId);
    }

    async addDJUser(guildId, userId) {
        return this.dj.addUser(guildId, userId);
    }

    async removeUser(guildId, userId) {
        return this.dj.removeUser(guildId, userId);
    }

    async removeDJUser(guildId, userId) {
        return this.dj.removeUser(guildId, userId);
    }

    async clearDJUsers(guildId) {
        return this.dj.clearUsers(guildId);
    }

    async getDJUsers(guildId) {
        return this.dj.getUsers(guildId);
    }

    async clearDJ(guildId, type = "all") {
        if (type === "roles") return this.dj.clearRoles(guildId);
        if (type === "users") return this.dj.clearUsers(guildId);
        return this.dj.clearAll(guildId);
    }

    async toggleDJ(guildId) {
        return this.dj.toggle(guildId);
    }

    // Setup
    async getSetup(guildId) {
        return guildId ? this.setup.get(guildId) : this.setup.getAll();
    }

    async setSetup(guildId, dataOrTextChannelId, messageId, parentChannelId, voiceChannelId) {
        return this.setup.set(guildId, dataOrTextChannelId, messageId, parentChannelId, voiceChannelId);
    }

    async deleteSetup(guildId) {
        return this.setup.delete(guildId);
    }

    // 24/7 Stay
    async getTwentyFourSeven(guildId) {
        return guildId ? this.stay.get(guildId) : this.stay.getAll();
    }

    async setTwentyFourSeven(guildId, textChannelId, voiceChannelId) {
        return this.stay.set(guildId, textChannelId, voiceChannelId);
    }

    async get_247(guildId) {
        return this.getTwentyFourSeven(guildId);
    }

    async set_247(guildId, textChannelId, voiceChannelId) {
        return this.setTwentyFourSeven(guildId, textChannelId, voiceChannelId);
    }

    async deleteTwentyFourSeven(guildId) {
        return this.stay.delete(guildId);
    }

    // Playlists
    async getPlaylist(userId, name) {
        return this.playlist.get(userId, name);
    }

    async getUserPlaylists(userId) {
        return this.playlist.getUserPlaylists(userId);
    }

    async getPlaylists(userId) {
        return this.playlist.getUserPlaylists(userId);
    }

    async createPlaylist(userId, name, isPrivate = false) {
        return this.playlist.create(userId, name, isPrivate);
    }

    async createPlaylistWithTracks(userId, name, tracks, isPrivate = false) {
        return this.playlist.createWithTracks(userId, name, tracks, isPrivate);
    }

    async setPlaylistPrivacy(userId, name, isPrivate) {
        return this.playlist.setPrivacy(userId, name, isPrivate);
    }

    async deletePlaylist(userId, name) {
        return this.playlist.delete(userId, name);
    }

    async deleteSongsFromPlaylist(userId, name) {
        return this.playlist.clearTracks(userId, name);
    }

    async addTracksToPlaylist(userId, name, tracks) {
        return this.playlist.addTracks(userId, name, tracks);
    }

    async addTrackToPlaylist(userId, name, track) {
        return this.playlist.addTracks(userId, name, [track]);
    }

    async setTracksInPlaylist(userId, name, tracks) {
        return this.playlist.setTracks(userId, name, tracks);
    }

    async removeSong(userId, name, encodedSong) {
        return this.playlist.removeTrack(userId, name, encodedSong);
    }

    async removeTrackFromPlaylist(userId, name, index) {
        return this.playlist.removeTrack(userId, name, index);
    }

    async getTracksFromPlaylist(userId, name) {
        return this.playlist.getTracks(userId, name);
    }

    // Whitelist / Channel & Role Command Restriction
    async getWhitelist(guildId) {
        return this.whitelist.get(guildId);
    }

    async setWhitelistMode(guildId, mode) {
        return this.whitelist.setMode(guildId, mode);
    }

    async toggleWhitelist(guildId) {
        return this.whitelist.toggle(guildId);
    }

    async addWhitelistChannel(guildId, channelId) {
        return this.whitelist.addChannel(guildId, channelId);
    }

    async removeWhitelistChannel(guildId, channelId) {
        return this.whitelist.removeChannel(guildId, channelId);
    }

    async clearWhitelistChannels(guildId) {
        return this.whitelist.clearChannels(guildId);
    }

    async addWhitelistRole(guildId, roleId) {
        return this.whitelist.addRole(guildId, roleId);
    }

    async removeWhitelistRole(guildId, roleId) {
        return this.whitelist.removeRole(guildId, roleId);
    }

    async clearWhitelistRoles(guildId) {
        return this.whitelist.clearRoles(guildId);
    }

    async addWhitelistUser(guildId, userId) {
        return this.whitelist.addUser(guildId, userId);
    }

    async removeWhitelistUser(guildId, userId) {
        return this.whitelist.removeUser(guildId, userId);
    }

    async clearWhitelistUsers(guildId) {
        return this.whitelist.clearUsers(guildId);
    }

    async clearWhitelist(guildId, type = "all") {
        if (type === "channels") return this.clearWhitelistChannels(guildId);
        if (type === "roles") return this.clearWhitelistRoles(guildId);
        if (type === "users") return this.clearWhitelistUsers(guildId);
        return this.whitelist.clearAll(guildId);
    }
}

module.exports = DatabaseManager;
