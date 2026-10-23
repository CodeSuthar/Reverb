const { int, mysqlTable, text, uniqueIndex, varchar } = require("drizzle-orm/mysql-core");
const config = require("../../../config.reverb.js");

const defaultPrefix = config.bot?.prefix || "r!";
const defaultVolume = config.music?.defaultVolume ?? 100;

const bot = mysqlTable("Bot", {
    botId: varchar("botId", { length: 64 }).primaryKey(),
    totalPlaySong: int("totalPlaySong").default(0),
});

const guild = mysqlTable("Guild", {
    guildId: varchar("guildId", { length: 64 }).primaryKey(),
    prefix: varchar("prefix", { length: 16 }).notNull().default(defaultPrefix),
    language: varchar("language", { length: 32 }).default("EnglishUS"),
    defaultVolume: int("defaultVolume").default(defaultVolume),
});

const stay = mysqlTable("Stay", {
    guildId: varchar("guildId", { length: 64 }).primaryKey(),
    textChannelId: varchar("textChannelId", { length: 64 }).notNull(),
    voiceChannelId: varchar("voiceChannelId", { length: 64 }).notNull(),
});

const dj = mysqlTable("Dj", {
    guildId: varchar("guildId", { length: 64 }).primaryKey(),
    mode: int("mode").notNull().default(0),
    roles: text("roles"),
    users: text("users"),
});

const playlist = mysqlTable(
    "Playlist",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        userId: varchar("userId", { length: 64 }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        tracks: text("tracks"),
        isPrivate: int("isPrivate").default(0),
    },
    (table) => [uniqueIndex("user_playlist_unique").on(table.userId, table.name)]
);

const setup = mysqlTable("Setup", {
    guildId: varchar("guildId", { length: 64 }).primaryKey(),
    parentChannelId: varchar("parentChannelId", { length: 64 }),
    textChannelId: varchar("textChannelId", { length: 64 }).notNull(),
    voiceChannelId: varchar("voiceChannelId", { length: 64 }),
    messageId: varchar("messageId", { length: 64 }).notNull(),
});

const whitelist = mysqlTable("Whitelist", {
    guildId: varchar("guildId", { length: 64 }).primaryKey(),
    mode: int("mode").notNull().default(0),
    channels: text("channels"),
    roles: text("roles"),
    users: text("users"),
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
