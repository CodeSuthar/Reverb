---
title: Bot Configuration (config.reverb.js)
description: Complete guide to static bot settings, audio nodes, emojis, and database defaults in config.reverb.js.
---

# ⚙️ Bot Configuration (`config.reverb.js`)

[🏠 Documentation Hub](../README.md) > [Configuration](./environment.md) > **config.reverb.js**

The file `config.reverb.js` serves as the centralized settings registry for Reverb. It controls bot metadata, developer IDs, audio streaming nodes (**NodeLink** & **Lavalink**), database options, and UI emojis.

---

## 1. File Structure Overview

```javascript
module.exports = {
    bot: { ... },
    music: { ... },
    playlist: { ... },
    database: { ... },
    emojis: { ... }
};
```

---

## 2. Configuration Sections

### `bot` Section
Defines public-facing metadata, developer IDs, and help menu visibility:

```javascript
bot: {
    name: "Reverb",
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    token: process.env.CLIENT_TOKEN || "",
    prefix: "r!",
    developerIds: [""], // Add developer Discord User IDs here
    showDeveloperCommandsInHelp: false, // false | true | "developers"
    invite: "",
    supportServer: "",
    main: process.env.MAIN_COLOR || "#FF66C4"
}
```

- **`prefix`**: Default message command prefix (default: `"r!"`). Server administrators can also configure custom prefixes per-server using `r!setprefix`.
- **`developerIds`**: Array of Discord User IDs with bot-developer privileges (can bypass DJ role checks and execute developer commands).
- **`showDeveloperCommandsInHelp`**: Controls developer commands and module visibility in the help desk:
  - `false` *(Default)*: Completely hidden from the help desk, statistics, select menus, command detail lookups, and slash autocomplete.
  - `true`: Visible to all users in the help desk and command detail lookups.
  - `"developers"`: Only visible to users whose Discord ID is listed in `developerIds`.
- **`main`**: The primary accent color for UI embeds and containers (hex code).

---

### `music` Section
Defines the audio streaming server connection cluster (**NodeLink** or **Lavalink**) and playback defaults:

```javascript
music: {
    defaultVolume: 100,
    maxVolume: 200,
    playYoutube: true,
    nodes: [
        {
            host: "localhost",
            port: 2333,
            password: "youshallnotpass",
            secure: false,
            identifier: "NodeLink-Main",
        }
    ]
}
```

- **`nodes`**: Array of audio streaming nodes. You can define multiple nodes; Moonlink automatically performs least-load balancing across all active nodes:
  - `host`: Hostname or IP of your NodeLink or Lavalink server (e.g. `"localhost"` or `"127.0.0.1"`).
  - `port`: Port number (default `2333` for standard NodeLink/Lavalink setups).
  - `password`: Node authentication password (must match `config.js` in NodeLink or `application.yml` in Lavalink).
  - `secure`: Set to `true` if your node runs behind an SSL/TLS proxy (`wss://`).
  - `identifier`: A recognizable name for the node.
- **`defaultVolume`**: Initial playback volume (default: `100`).
- **`maxVolume`**: Maximum permissible volume slider cap (default: `200`).
- **`playYoutube`**: Whether YouTube playback is permitted.

---

### `playlist` Section
Controls limits for personal saved playlists:

```javascript
playlist: {
    maxPlaylistsPerUser: 25,
    maxTracksPerPlaylist: 1000
}
```

---

### `database` Section
Defines provider configurations, linking environment variables with fallback defaults:

```javascript
database: {
    provider: process.env.DATABASE_PROVIDER || "sqlite",
    url: process.env.DATABASE_URL || "",
    mongodb: {
        uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/reverb"
    },
    postgres: {
        url: process.env.POSTGRES_URL || "postgres://postgres:postgres@localhost:5432/reverb"
    },
    mysql: {
        url: process.env.MYSQL_URL || ""
    },
    sqlite: {
        path: process.env.SQLITE_PATH || "./data/reverb.db"
    },
    pglite: {
        dataDir: process.env.PGLITE_DATA_DIR || "./data/reverb-pgdata"
    }
}
```

---

### `emojis` Section
Defines the centralized emoji set used across interactive buttons, player cards, and help menus:

```javascript
emojis: {
    tick: "✅",
    cross: "❌",
    loading: "⏳",
    nowplaying: "🎶",
    queue: "📜",
    previous: "⏮️",
    pause: "⏸️",
    resume: "▶️",
    skip: "⏭️",
    stop: "⏹️",
    loop: "🔁",
    shuffle: "🔀"
    // ... custom emojis can be substituted directly
}
```

::: tip Custom Discord Emojis
You can substitute standard unicode emojis with custom Discord server emojis formatted as `<:emoji_name:emoji_id>` or `<a:animated_name:emoji_id>`.
:::

---

## ⏭️ Next Step

Learn about data persistence in **[Database & Storage Layer](./database.md)**.
