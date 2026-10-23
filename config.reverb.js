require("dotenv").config();

module.exports = {
    bot: {
        name: "Reverb",
        clientId: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        token: process.env.CLIENT_TOKEN || "",
        prefix: "r!",
        developerIds: [""],
        // Whether developer commands and developer statistics/modules display in the help menu and help args (r!help <command> / /help [command])
        // Options:
        //   false        -> completely hidden from help desk, categories, and command args/autocomplete
        //   true         -> visible in help desk, categories, and command args/autocomplete for all users
        //   "developers" -> only visible in help desk, categories, and command args to authorized bot developers (in developerIds)
        showDeveloperCommandsInHelp: false,
        invite: "https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands",
        supportServer: "https://discord.gg/6UwVYHu2zu",
        main: process.env.MAIN_COLOR || "#FF66C4"
    },

    music: {
        defaultVolume: 100,
        maxVolume: 200,
        playYoutube: true,
        nodes: [
            {
                host: `localhost`,
                port: 3000,
                password: "youshallnotpass",
                secure: false,
                identifier: "Example 1"
            }
        ]
    },

    playlist: {
        maxPlaylistsPerUser: 25,
        maxTracksPerPlaylist: 1000
    },

    database: {
        provider: process.env.DATABASE_PROVIDER || (
            process.env.DATABASE_URL
                ? (process.env.DATABASE_URL.startsWith("postgres") ? "postgres"
                    : process.env.DATABASE_URL.startsWith("mysql") ? "mysql"
                    : process.env.DATABASE_URL.startsWith("sqlite") ? "sqlite"
                    : "sqlite")
                : (process.env.MONGO_URI ? "mongodb" : "sqlite")
        ),
        url: process.env.DATABASE_URL || "",
        mongodb: {
            uri: process.env.MONGO_URI || process.env.DATABASE_URL || "",
            options: {
                autoIndex: false,
                connectTimeoutMS: 10000,
                family: 4
            }
        },
        postgres: {
            url: process.env.POSTGRES_URL || process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/reverb",
            ssl: process.env.POSTGRES_SSL === "true"
        },
        mysql: {
            url: process.env.MYSQL_URL || process.env.DATABASE_URL || "",
            host: process.env.MYSQL_HOST || "localhost",
            port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
            user: process.env.MYSQL_USER || "root",
            password: process.env.MYSQL_PASSWORD || "",
            database: process.env.MYSQL_DATABASE || "reverb"
        },
        sqlite: {
            path: process.env.SQLITE_PATH || "./data/reverb.db"
        },
        pglite: {
            dataDir: process.env.PGLITE_DATA_DIR || "./data/reverb-pgdata"
        },
        mongoURI: process.env.MONGO_URI || process.env.DATABASE_URL || ""
    },

    emojis: {
        tick: "✅",
        cross: "❌",
        loading: "⏳",
        hey: "👋",
        nowplaying: "🎶",
        note: "🎵",
        notes: "🎶",
        queue: "📜",
        join: "📥",
        leave: "📤",
        previous: "⏮️",
        seek: {
            forward: "⏩",
            backward: "⏪"
        },
        seekforward: "⏩",
        seekback: "⏪",
        pause: "⏸️",
        resume: "▶️",
        livestream: "📡",
        skip: "⏭️",
        volume: {
            default: "🔊",
            up: "🔊",
            down: "🔉"
        },
        stop: "⏹️",
        shuffle: "🔀",
        loop: {
            default: "🔁",
            track: "🔂",
            queue: "🔁",
            off: "▶️"
        },
        musicButtons: {
            previous: "⏮️",
            play: "▶️",
            pause: "⏸️",
            next: "⏭️",
        },
        buttons: {
            previous: "◀️",
            next: "▶️",
            home: "🏠",
            close: "✖️"
        },
        lyrics: "🎤",
        clock: "🕒",
        timeout: "⏱️",
        lightbulb: "💡",
        filters: "🎛️",
        headphones: "🎧",
        help: "🎧",
        book: "📖",
        lock: "🔒",
        public: "🌐",
        mail: "📬",
        warning: "⚠️",
        shield: "🛡️",
        pin: "📍",
        user: "👤",
        flag: "🏁",
        avatar: "🖼️",
        banner: "🎴",
        keyboard: "⌨️",
        trash: "🗑️",
        enabled: "🟢",
        disabled: "🔴",
        categories: {
            home: "🏠",
            configuration: "⚙️",
            filter: "🎛️",
            info: "ℹ️",
            music: "🎵",
            playlist: "📂",
            developer: "🛠️"
        }
    }
};
