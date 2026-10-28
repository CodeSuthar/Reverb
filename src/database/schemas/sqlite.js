const {
    int, sqliteTable, text, uniqueIndex
} = require("drizzle-orm/sqlite-core");
const config = require("../../../config.reverb.js");

const defaultPrefix = config.bot?.prefix || "r!";
const defaultVolume = config.music?.defaultVolume ?? 100;

const bot = sqliteTable("Bot", {
    botId: text("botId").primaryKey(),
    totalPlaySong: int("totalPlaySong").default(0),
});

const guild = sqliteTable("Guild", {
    guildId: text("guildId").primaryKey(),
    prefix: text("prefix").notNull().default(defaultPrefix),
    language: text("language").default("EnglishUS"),
    defaultVolume: int("defaultVolume").default(defaultVolume),
});

const stay = sqliteTable("Stay", {
    guildId: text("guildId").primaryKey(),
    textChannelId: text("textChannelId").notNull(),
    voiceChannelId: text("voiceChannelId").notNull(),
});

const dj = sqliteTable("Dj", {
    guildId: text("guildId").primaryKey(),
    mode: int("mode").notNull().default(0),
    roles: text("roles").notNull().default("[]"),
    users: text("users").notNull().default("[]"),
});

const playlist = sqliteTable(
    "Playlist",
    {
        id: text("id").primaryKey(),
        userId: text("userId").notNull(),
        name: text("name").notNull(),
        tracks: text("tracks"),
        isPrivate: int("isPrivate").default(0),
    },
    (table) => [uniqueIndex("user_playlist_unique").on(table.userId, table.name)]
);

const setup = sqliteTable("Setup", {
    guildId: text("guildId").primaryKey(),
    parentChannelId: text("parentChannelId"),
    textChannelId: text("textChannelId").notNull(),
    voiceChannelId: text("voiceChannelId"),
    messageId: text("messageId").notNull(),
});

const whitelist = sqliteTable("Whitelist", {
    guildId: text("guildId").primaryKey(),
    mode: int("mode").notNull().default(0),
    channels: text("channels").notNull().default("[]"),
    roles: text("roles").notNull().default("[]"),
    users: text("users").notNull().default("[]"),
});

module.exports = {
    bot,
    guild,
    stay,
    dj,
    playlist,
    setup,
    whitelist,
};
