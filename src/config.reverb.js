module.exports = {
    bot: {
        name: "",
        clientId: process.env.CLIENT_ID || "",
        clientSecret: process.env.CLIENT_SECRET || "",
        token: process.env.TOKEN || "",
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

    // Webhooks: {
    //     Lavalinks: process.env.LavalinkWebhook || "",
    // },

    // BotList: {
    //     TopGG: {
    //         APIToken: process.env.TopGGToken || "",
    //         LinkToVote: ""
    //     }
    // },

    // Dashboard: {
    //     ShouldRun: true,
    //     Information: {
    //         ClientID: process.env.CLIENT_ID || "",
    //         ClientSecret: process.env.CLIENT_SECRET || "",
    //         Domain: process.env.DOMAIN || "",
    //         CallbackURL: process.env.CallbackURL || "/api/callback",
    //         Port: 3180,
    //         Scopes: ["identify", "guilds"],
    //         ReverseProxy: ""
    //     } 
    // },
    
    database: {
        mongoURI: process.env.MONGO_URI || "mongodb+srv://idk:idk@reverbbot.xtg4h0y.mongodb.net/?appName=ReverbBot",
    },

    emojis: {
        tick: "<:icons_1:1558609677342744806>",
        cross: "<:icons_2:1558609712076030004>",
        hey: "👋",
        join: "📥",
        leave: "📤",
    }
}