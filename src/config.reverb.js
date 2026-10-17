require("dotenv").config();

module.exports = {
    bot: {
        name: "",
        clientId: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        token: process.env.CLIENT_TOKEN || "",
        prefix: "!",
        developerIds: [""],
        invite: "",
        supportServer: ""
    },

    music: {
        defaultVolume: 100,
        maxVolume: 200,
        playYoutube: false
    },

    lavalink: {
        nodes: [
            {
                host: "lavalink.nazha.online",
                port: 443,
                authorization: "nazhafreelava",
                id: "Nazha Lavalink Node",
                secure: true
            }
        ]
    },

    database: {
        mongoURI: process.env.MONGO_URI || "",
    },

    emojis: {
        tick: "✅",
        cross: "❌",
        loading: "⏳",
        hey: "👋",
        join: "📥",
        leave: "📤",
    }
}