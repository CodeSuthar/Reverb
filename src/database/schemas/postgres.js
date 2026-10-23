const { integer, pgTable, text, uniqueIndex } = require("drizzle-orm/pg-core");
const config = require("../../../config.reverb.js");

const defaultPrefix = config.bot?.prefix || "r!";
const defaultVolume = config.music?.defaultVolume ?? 100;

const bot = pgTable("Bot", {
    botId: text("botId").primaryKey(),
    totalPlaySong: integer("totalPlaySong").default(0),
});

const guild = pgTable("Guild", {
    guildId: text("guildId").primaryKey(),
    prefix: text("prefix").notNull().default(defaultPrefix),
    language: text("language").default("EnglishUS"),
    defaultVolume: integer("defaultVolume").default(defaultVolume),
});

const stay = pgTable("Stay", {
    guildId: text("guildId").primaryKey(),
    textChannelId: text("textChannelId").notNull(),
    voiceChannelId: text("voiceChannelId").notNull(),
});

const dj = pgTable("Dj", {
    guildId: text("guildId").primaryKey(),
    mode: integer("mode").notNull().default(0),
    roles: text("roles").notNull().default("[]"),
    users: text("users").notNull().default("[]"),
});

const playlist = pgTable(
    "Playlist",
    {
        id: text("id").primaryKey(),
        userId: text("userId").notNull(),
        name: text("name").notNull(),
        tracks: text("tracks"),
        isPrivate: integer("isPrivate").default(0),
    },
    (table) => [uniqueIndex("user_playlist_unique").on(table.userId, table.name)]
);

const setup = pgTable("Setup", {
    guildId: text("guildId").primaryKey(),
    parentChannelId: text("parentChannelId"),
    textChannelId: text("textChannelId").notNull(),
    voiceChannelId: text("voiceChannelId"),
    messageId: text("messageId").notNull(),
});

const whitelist = pgTable("Whitelist", {
    guildId: text("guildId").primaryKey(),
    mode: integer("mode").notNull().default(0),
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
