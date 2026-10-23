# 🎧 Reverb Music Bot — Complete Setup & Architecture Guide

A complete, production-grade guide to configuring, running, operating, and extending **Reverb**, a modern Discord music bot powered by **discord.js v14**, **Moonlink.js (Lavalink)**, **Discord Components V2**, and a multi-driver database layer.

---

> [!NOTE] Official Bot Available
> Prefer not to host your own instance? You can invite the **[Official Reverb Bot](https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands)** directly to your server or join the **[Discord Support Server](https://discord.gg/6UwVYHu2zu)**!

---

## 📋 Table of Contents
1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Discord Developer Portal Configuration](#2-discord-developer-portal-configuration)
3. [Audio Streaming Node Setup (NodeLink & Lavalink)](#3-audio-streaming-node-setup)
4. [Environment & Bot Configuration](#4-environment--bot-configuration)
5. [Database Configuration](#5-database-configuration)
6. [Installation & Launch](#6-installation--launch)
7. [System Architecture & Directory Structure](#7-system-architecture--directory-structure)
8. [Core Workflows & Lifecycles](#8-core-workflows--lifecycles)
9. [Key Features & Commands Overview](#9-key-features--commands-overview)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)
11. [Project Story & Roadmap (The Reverb Story)](./about/story.md)

---

## 1. Prerequisites & System Requirements

Before setting up Reverb, ensure the following software is installed on your host machine or server:

| Software | Required Version | Purpose & Official Resource |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.17.0` (Recommended: `v22.x LTS`) | JavaScript runtime engine — **[Official Node.js Downloads](https://nodejs.org/en/download)** • **[Package Manager Guide](https://nodejs.org/en/download/package-manager)** |
| **Package Manager** | `pnpm` (`v9.x`+), `npm` (`v10.x`+), or `yarn` (`v1.x` / `v4.x`) | Dependency installation and workspace resolution — **[pnpm Official](https://pnpm.io/installation)** • **[npm Official](https://docs.npmjs.com/)** • **[Yarn Official](https://yarnpkg.com/getting-started/install)** |
| **Audio Server** | **NodeLink** (Recommended) or **Lavalink v4** | Standalone audio streaming daemon — **[NodeLink Guide](./getting-started/nodelink-setup.md)** • **[Lavalink Guide](./getting-started/lavalink-setup.md)** |
| **Java (JRE/JDK)** | `Java 17` or `Java 21` (64-bit) | *Only required if using Lavalink*. Not needed for NodeLink! — **[Eclipse Adoptium Temurin (Official OpenJDK)](https://adoptium.net/temurin/releases/)** • **[Oracle Java](https://www.oracle.com/java/technologies/downloads/)** |
| **Database** *(Optional)* | SQLite (default), MongoDB, PostgreSQL, or MySQL | Persistent storage for prefixes, DJ settings, playlists, and channel setups |

> [!TIP]
> By default, Reverb includes zero-configuration SQLite support (`better-sqlite3`). You do not need to install an external database server to run the bot out of the box!

---

## 2. Discord Developer Portal Configuration

### Step 2.1: Create Application & Bot User
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, name your application (e.g. `Reverb`), and accept the Developer Terms.
3. In the left sidebar, navigate to **Bot**:
   - Click **Add Bot** (if prompted).
   - Under **Token**, click **Reset Token** to generate a new Bot Token. Copy and save this token (this will be your `CLIENT_TOKEN`).
   - Under **Public Bot**, toggle based on your preference.

### Step 2.2: Enable Privileged Gateway Intents
Scroll down to the **Privileged Gateway Intents** section on the **Bot** page and enable all three required intents:
- ✅ **Presence Intent** *(optional)*
- ✅ **Server Members Intent** *(recommended for role/DJ lookups)*
- ✅ **Message Content Intent** *(MANDATORY for prefix command handling `r!<command>` and song requests channel text parsing)*

> [!IMPORTANT]
> If **Message Content Intent** is not enabled in the Developer Portal, the bot will not be able to read message commands or text sent into the song-requests channel!

### Step 2.3: Generate Bot Invite Link
1. In the left sidebar, navigate to **OAuth2** ➔ **URL Generator**.
2. Under **Scopes**, select:
   - ✅ `bot`
   - ✅ `applications.commands` (enables Slash Commands)
3. Under **Bot Permissions**, select the following required permissions:
   - Manage Channels (`16`)
   - Manage Messages (`8192`)
   - View Channels (`1024`)
   - Send Messages (`2048`)
   - Send Messages in Threads (`274877906944`)
   - Embed Links (`16384`)
   - Attach Files (`32768`)
   - Read Message History (`65536`)
   - Use External Emojis (`262144`)
   - Use External Stickers (`137438953472`)
   - Add Reactions (`64`)
   - Connect (`1048576`)
   - Speak (`2097152`)
   - Change Nickname (`67108864`)
   - Set Voice Channel Status (`281474976710656`)
4. Copy the generated invite URL. Reverb's precomputed permission integer is **`281891692735824`**:
   ```
   https://discord.com/oauth2/authorize?client_id=<YOUR_CLIENT_ID>&permissions=281891692735824&integration_type=0&scope=bot+applications.commands
   ```

---

## 3. Audio Streaming Node Setup

Reverb relies on **[Moonlink.js](https://moonlink.js.org/)** (developed by [1Lucas9k / Ecliptia](https://github.com/Ecliptia/moonlink.js)) as its high-performance audio client. Moonlink.js communicates with your standalone audio daemon via WebSockets.

Reverb supports two audio streaming servers:
1. **[NodeLink](https://nodelink.js.org/) (Recommended)** — 100% pure Node.js, zero Java requirement, built-in sources for 15+ streaming platforms, low memory footprint.
2. **[Lavalink v4](https://lavalink.dev/) (Alternative)** — Traditional Java-based audio server requiring Java 17/21 and external Maven plugins.

---

### Option A: NodeLink Setup (Recommended)

NodeLink is developed by the [PerformanC Team](https://github.com/PerformanC). Reverb supports NodeLink natively because Moonlink.js was built with first-class NodeLink compatibility, and NodeLink has all source extractors (YouTube, Spotify, Apple Music, Deezer, SoundCloud) built right into the core server without external plugins.

1. **Clone and Install NodeLink**:
   ```bash
   git clone https://github.com/PerformanC/NodeLink.git
   cd NodeLink
   npm install
   ```

2. **Configure NodeLink (`config.js`)**:
   ```bash
   # Copy default configuration
   cp config.default.js config.js
   ```
   Open `config.js` and ensure the server password matches Reverb (`youshallnotpass` by default on port `2333`):
   ```javascript
   module.exports = {
     server: {
       port: 2333,
       address: "0.0.0.0",
       password: "youshallnotpass"
     },
     sources: {
       youtube: true,
       spotify: { enabled: true, market: "US" },
       soundcloud: { enabled: true },
       applemusic: { enabled: true },
       deezer: { enabled: true }
     }
   };
   ```

3. **Start NodeLink**:
   ```bash
   npm start
   ```

*(For full details, see the dedicated [NodeLink Setup Guide](./getting-started/nodelink-setup.md).)*

---

### Option B: Lavalink v4 Setup (Alternative)

Developed by the [Lavalink Devs](https://lavalink.dev/), Lavalink is a Java-based audio daemon.

> [!NOTE] Java Requirement
> Lavalink requires a 64-bit Java 17 or 21 runtime. Download official builds from **[Eclipse Adoptium Temurin](https://adoptium.net/temurin/releases/)** or **[Oracle Java](https://www.oracle.com/java/technologies/downloads/)**.

1. **Download Lavalink**:
   Download `Lavalink.jar` (v4.0.0+) from [Lavalink GitHub Releases](https://github.com/lavalink-devs/Lavalink/releases).

2. **Create `application.yml`**:
   In the same directory as `Lavalink.jar`:
   ```yaml
   server:
     port: 2333
     address: 0.0.0.0

   lavalink:
     plugins:
       - dependency: "dev.lavalink.youtube:youtube-plugin:1.11.4"
         repository: "https://maven.lavalink.dev/releases"
       - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.3.0"
         repository: "https://maven.lavalink.dev/releases"
     server:
       password: "youshallnotpass"
       sources:
         youtube: false
         soundcloud: true
         bandcamp: true
         twitch: true
         http: true
   ```

3. **Run Lavalink**:
   ```bash
   java -jar Lavalink.jar
   ```

*(For full details, see the dedicated [Lavalink Setup Guide](./getting-started/lavalink-setup.md).)*

---

## 4. Environment & Bot Configuration

### Step 4.1: `.env` File
Create a `.env` file in the project root based on `.env.example`:

```dotenv
CLIENT_ID=your_discord_client_id
CLIENT_SECRET=your_discord_client_secret
CLIENT_TOKEN=your_discord_bot_token

# Database selection: mongodb | postgres | mysql | sqlite | pglite
# If left empty, will auto-detect from MONGO_URI, DATABASE_URL, or default to sqlite
DATABASE_PROVIDER=sqlite

# Provider specific options:
MONGO_URI=mongodb://127.0.0.1:27017/reverb
# POSTGRES_URL=postgres://postgres:postgres@localhost:5432/reverb
# MYSQL_URL=mysql://root:password@localhost:3306/reverb
# SQLITE_PATH=./data/reverb.db
# PGLITE_DATA_DIR=./data/reverb-pgdata
```

### Step 4.2: Bot Settings (`config.reverb.js`)
Open [`config.reverb.js`](./configuration/bot-config.md) and verify:
- `bot.prefix`: Default message prefix (default: `"r!"`).
- `bot.developerIds`: Array of your Discord User IDs for developer command bypass.
- `bot.showDeveloperCommandsInHelp`: Controls whether developer commands and statistics display in the help desk (`false`, `true`, or `"developers"`).
- `music.nodes`: Host, port, and password matching your NodeLink or Lavalink node:
  ```javascript
  nodes: [
      {
          host: "localhost",
          port: 2333,
          password: "youshallnotpass",
          secure: false,
          identifier: "NodeLink-Main"
      }
  ]
  ```

---

## 5. Database Configuration

Reverb supports 5 database engines seamlessly managed by `src/database/DatabaseManager.js`:

```mermaid
flowchart TD
    App[Reverb Bot Application] --> DM[DatabaseManager]
    DM --> Repos[Repositories: Guild, Setup, DJ, Stay 24/7, Playlist]
    Repos --> Adapter{DATABASE_PROVIDER}
    Adapter -->|sqlite| SQLite[(SQLite - better-sqlite3)]
    Adapter -->|mongodb| Mongo[(MongoDB - Mongoose)]
    Adapter -->|postgres| PG[(PostgreSQL - Drizzle ORM)]
    Adapter -->|mysql| MySQL[(MySQL - Drizzle ORM)]
    Adapter -->|pglite| PGlite[(PGlite In-Memory / Local)]
```

### Options:
1. **SQLite (Zero Config - Default)**:
   - Requires no extra setup! A local database file is created at `data/reverb.db`.
2. **MongoDB**:
   - Set `DATABASE_PROVIDER=mongodb` and `MONGO_URI=mongodb://127.0.0.1:27017/reverb`.
3. **PostgreSQL / MySQL**:
   - Set `DATABASE_DRIVER=postgresql` or `mysql` and supply `POSTGRES_URL` or `MYSQL_URL`.
   - Push Drizzle migrations:
     ::: code-group

     ```bash [pnpm]
     pnpm run db:push
     ```

     ```bash [npm]
     npm run db:push
     ```

     ```bash [yarn]
     yarn db:push
     ```

     :::

---

## 6. Installation & Launch

### Step 6.1: Clone the Repository
Clone the official Reverb repository from GitHub:

```bash
git clone https://github.com/CodeSuthar/Reverb.git
cd Reverb
```

### Step 6.2: Install Dependencies
In the project root directory, install all packages using your preferred package manager:

::: code-group

```bash [pnpm]
pnpm install
```

```bash [npm]
npm install
```

```bash [yarn]
yarn install
```

:::

### Step 6.2: Start the Bot

::: code-group

```bash [pnpm]
pnpm start
```

```bash [npm]
npm start
```

```bash [yarn]
yarn start
```

```bash [node (direct)]
node index.js
```

:::

### Startup Log Output:
```text
[ SUCCESS  ] › [ DATABASE ] SQLITE database connected successfully
[ MUSIC    ] › Loaded 25 music events
[ EVENT    ] › Successfully loaded 7 client events
[ SUCCESS  ] › Successfully loaded 59 message commands
[ SUCCESS  ] › Successfully loaded 59 slash commands (/)
[ SUCCESS  ] › Successfully initialized all 4 core handler systems
[ SUCCESS  ] › Logged in as Reverb#1234
[ MUSIC    ] › Node NodeLink-Main connected successfully
```

---

## 7. System Architecture & Directory Structure

```
Reverb/
├── config.reverb.js                # Core configuration (bot, nodes, emojis, colors)
├── index.js                        # Sharding entrypoint: spawns ShardingManager
├── src/
│   ├── reverbClient.js             # Shard child process instantiator
│   ├── structures/
│   │   ├── client.js               # ReverbClient: discord.js Client subclass
│   │   ├── reverbManager.js        # Moonlink Manager wrapper
│   │   ├── reverbPlayerManager.js  # Custom player manager
│   │   └── reverbPlayer.js         # Custom player methods (fairplay, data caching)
│   ├── handler/
│   │   ├── commands.js             # Message (prefix) command loader
│   │   ├── slashCommands.js        # Slash (/) command loader & REST registrar
│   │   ├── clientEvents.js         # Discord client event loader
│   │   └── errors.js               # Process unhandledRejection / uncaughtException logger
│   ├── database/
│   │   ├── DatabaseManager.js      # Unified database abstraction layer
│   │   ├── repositories/           # Repositories (bot, dj, guild, playlist, setup, stay, whitelist)
│   │   ├── providers/              # Multi-engine providers (sqlite, postgres, mysql, mongodb, pglite)
│   │   └── schemas/                # Drizzle schemas
│   ├── events/
│   │   ├── client/                 # clientReady.js, raw.js
│   │   ├── commands/               # messageCreate.js, interactionCreate.js, autoComplete.js
│   │   ├── music/                  # Moonlink events: node/, player/, queue/, track/
│   │   └── system/                 # setupButtons.js (playback button handler), setupSystem.js
│   ├── commands/
│   │   ├── messages/               # 59 Prefix Message Commands (6 categories)
│   │   └── slash/                  # 59 Application Slash Commands (6 categories)
│   └── utils/
│       ├── buildSetupView.js       # Song-Requests channel container builder
│       ├── buildTrackPlayer.js     # Track Notification container builder
│       ├── buildHelpView.js        # Help Menu container builder & autocomplete
│       ├── buildCustomizeView.js   # Server Customization panel & modals
│       └── logger.js               # Styled terminal logger (client.logger)
```

---

## 8. Core Workflows & Lifecycles

### 8.1: Startup & Initialization Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant App as index.js
    participant Client as ReverbClient
    participant DB as DatabaseManager
    participant ML as Moonlink (reverbManager)
    participant Handlers as Core Handlers
    participant Discord as Discord Gateway

    App->>Client: new ReverbClient()
    App->>Client: client.build()
    Client->>DB: connect()
    DB-->>Client: Database Connected
    Client->>ML: Initialize Lavalink Nodes
    Client->>Handlers: Load clientEvents, commands, slashCommands, errors
    Handlers-->>Client: Loaded 58 msg cmds, 58 slash cmds, 25 music events
    App->>Client: client.deploy()
    Client->>Discord: login(CLIENT_TOKEN)
    Discord-->>Client: clientReady event
    Client->>Discord: Refresh Application (/) Commands via REST
```

---

### 8.2: Track Playback & Queue Management

```mermaid
flowchart TD
    User([User runs play or clicks button]) --> MsgCheck{Setup Channel or Standard?}
    MsgCheck -->|Setup Channel| Clean[Delete user chat msg & queue track]
    MsgCheck -->|Standard Channel| Queue[Queue track & send confirmation]

    Queue --> TS[Moonlink emits trackStart]
    Clean --> TS

    TS --> VS[updateVoiceStatus: Set Discord Voice Status 🎵 • Title]
    TS --> SM[executeViewUpdate: Update Setup Channel Container]
    TS --> TM[Send Components V2 Track Player in Text Channel]

    UserAct[User adds/removes songs] --> QA[Moonlink emits queueAdd / queueRemove]
    QA --> LiveUpdate[executeViewUpdate: Live refresh Setup Up Next queue]

    End[Queue Finishes] --> QE[Moonlink emits queueEnd]
    QE --> ClearVS[Clear Voice Status]
    QE --> IdleSetup[Reset Setup Channel Container to Idle]
    QE --> SendEnd[Send Components V2 Queue Finished Card with Replay button]
```

---

### 8.3: Dynamic Permission & DJ Role Validation

Both `messageCreate.js` and `interactionCreate.js` enforce multi-tier validation:

```mermaid
flowchart TD
    Cmd[Incoming Command or Playback Button] --> DevCheck{Is Bot Developer?}
    DevCheck -->|Yes| Exec[Execute Action]
    DevCheck -->|No| ClientPerms{Bot has required Client Permissions?}
    ClientPerms -->|No| Error1[Reply: Missing Bot Permissions]
    ClientPerms -->|Yes| UserPerms{User has required User Permissions?}
    UserPerms -->|No| Error2[Reply: Missing User Permissions]
    UserPerms -->|Yes| VoiceReq{Requires Voice / Same Voice?}
    VoiceReq -->|No| DJCheck{Command / Button requires DJ?}
    VoiceReq -->|Failed| Error3[Reply: Join voice / same voice channel]
    VoiceReq -->|Passed| DJCheck
    DJCheck -->|No| Exec
    DJCheck -->|Yes| DJMode{Is DJ Mode Active?}
    DJMode -->|No| Exec
    DJMode -->|Yes| RolesSet{Are DJ roles configured?}
    RolesSet -->|No| Error4[Reply: DJ mode on but no DJ roles configured]
    RolesSet -->|Yes| UserIsDJ{User has DJ Role or Manage Server?}
    UserIsDJ -->|Yes| Exec
    UserIsDJ -->|No| Error5[Reply: Need DJ role or Manage Server]
```

---

## 9. Key Features & Commands Overview

Reverb provides **58 commands** grouped into 6 primary modules:

### 🎵 1. Music & Playback (`music`)
- `play`, `playnext`, `pause`, `resume`, `skip`, `skipto`, `stop`, `seek`, `replay`, `volume`, `nowplaying`, `queue`, `clearqueue`, `shuffle`, `loop`, `lyrics`, `autoplay`, `fairplay`, `grab`, `join`, `leave`, `search`.

### 🎛️ 2. Audio DSP Filters (`filter`)
- `filters`, `8d`, `bassboost`, `chipmunk`, `darthvader`, `daycore`, `doubletime`, `earrape`, `karaoke`, `nightcore`, `pop`, `soft`, `treblebass`, `vaporwave`, `reset`.

### 📂 3. Custom Playlists (`playlist`)
- User-managed playlists with full subcommands:
  - `playlist create <name>`
  - `playlist delete <name>`
  - `playlist add <name> [song]`
  - `playlist remove <name> <position>`
  - `playlist list [page]`
  - `playlist load <name>`
  - `playlist clone <targetUser> <name>`

### ⚙️ 4. Server Configuration (`configuration`)
- `setup <create | delete | info>`: Automated song-requests channel with persistent Components V2 interactive controller.
- `customize`: Live Discord server appearance panel (avatar, banner, nickname, bio) powered by `guild.members.editMe`.
- `dj <toggle | add | remove | list | clear | status>`: Granular DJ role management.
- `247`: Toggle 24/7 non-stop connection in voice channels.
- `setprefix <prefix | reset>`: Custom guild command prefix.

### ℹ️ 5. Information & Help (`info`)
- `help [command]`: Interactive Components V2 Help Desk with category select menu, pagination, and autocomplete.
- `ping`, `about`, `botinfo`, `invite`, `api`.

### 🛠️ 6. Developer (`developer`)
- `eval`, `restart`, `shutdown`, `guildlist`, `guildleave`, `createinvite`, `deleteinvites`.

---

## 10. Troubleshooting & FAQ

### Q1: Bot crashes with `DiscordAPIError[50013]: Missing Permissions` on `setup create`
- **Cause**: Bot is missing `Manage Channels` or `Manage Messages` in the server.
- **Fix**: Re-invite the bot with the updated permissions integer **`281891692735824`** or grant the bot a role with `Manage Channels` and `Manage Messages`.

### Q2: Lavalink connection fails (`ECONNREFUSED`)
- **Cause**: The Lavalink process is not running or the host/port/password in `config.reverb.js` does not match `application.yml`.
- **Fix**: Verify Java 17+ is running `Lavalink.jar` on port `2333` with password `youshallnotpass`.

### Q3: Message commands (`r!play`) don't do anything, but Slash commands (`/play`) work
- **Cause**: **Message Content Intent** is disabled in the Discord Developer Portal.
- **Fix**: Go to the Developer Portal ➔ **Bot** tab ➔ enable **Message Content Intent**.

### Q4: Bot plays music but buttons say "You need the DJ role"
- **Cause**: DJ mode is enabled in the server (`r!dj toggle`) and your user lacks a designated DJ role or `Manage Server` permission.
- **Fix**: Add a DJ role using `r!dj add @Role` or disable DJ mode with `r!dj toggle`. Bot developers automatically bypass this check.
