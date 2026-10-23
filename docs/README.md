---
title: Reverb Documentation Hub
description: Official documentation for Reverb — a modern, high-fidelity Discord music bot built with discord.js v14, Moonlink.js, NodeLink, and multi-engine database support.
---

# 📖 Reverb Documentation Hub

Welcome to the official documentation for **Reverb** — a modern, high-fidelity Discord music bot built with **discord.js v14**, **Moonlink.js (NodeLink & Lavalink)**, and a multi-engine database layer.

Whether you are hosting Reverb for the first time, setting up NodeLink, configuring advanced audio filters, or managing guild settings, this multi-page documentation covers everything you need.

---

## 🤖 Official Bot & Support Server

Don't want to self-host? You can invite the **Official Reverb Bot** directly to your Discord server or join our official community support server:

- 🔗 **Official Bot Invite:** [Click Here to Invite Reverb](https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands)
- 💬 **Discord Support Server:** [discord.gg/6UwVYHu2zu](https://discord.gg/6UwVYHu2zu)

<p align="center">
  <iframe src="https://discord.com/widget?id=1562271632209481859&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
</p>

---

## 🗺️ Documentation Sitemap

### 🚀 Getting Started
1. **[System Prerequisites](./getting-started/prerequisites.md)**  
   Hardware specifications, Node.js 22+, package managers (`pnpm`, `npm`, `yarn`), and system verification.
2. **[Discord Developer Portal Setup](./getting-started/discord-portal.md)**  
   Application creation, privileged gateway intents, and OAuth2 invite link with exact permission bits (`281891692735824`).
3. **[NodeLink Audio Server Setup (Recommended)](./getting-started/nodelink-setup.md)**  
   Installing, configuring, and running NodeLink — the recommended 100% Node.js audio server with built-in multi-source support.
4. **[Moonlink.js Client Library Guide](./getting-started/moonlink.md)**  
   Overview of Moonlink.js, its native NodeLink synergy, queue mechanics, and audio filter pipeline.
5. **[Lavalink v4 Setup (Alternative)](./getting-started/lavalink-setup.md)**  
   Setting up a traditional Java-based Lavalink v4 server, `application.yml` plugins, and systemd service.
6. **[Installation & First Boot](./getting-started/installation.md)**  
   Cloning the repository, installing dependencies (`pnpm`, `npm`, `yarn`), configuring `.env`, and launching Reverb.

---

### ⚙️ Configuration
7. **[Environment Variables (.env)](./configuration/environment.md)**  
   Detailed breakdown of all `.env` keys: bot token, client ID, owner IDs, database drivers, and ports.
8. **[Bot Configuration (config.reverb.js)](./configuration/bot-config.md)**  
   Audio node cluster definitions, UI emojis, brand colors, default search engine, and timeouts.
9. **[Database & Storage Layer](./configuration/database.md)**  
   Zero-config SQLite (`better-sqlite3`), MongoDB (Mongoose), and SQL engines (PostgreSQL/MySQL via Drizzle ORM).

---

### 🎛️ Features & Operations
10. **[Music Engine & Audio Pipeline](./features/music-system.md)**  
    Audio volume curves, autoplay algorithms, hardware audio filters (Bassboost, Nightcore, 8D), and LRCLIB synchronized lyrics.
11. **[Dedicated Song Requests Channel](./features/setup-channel.md)**  
    How `r!setup create` / `/setup create` works, persistent player cards, and real-time queue updater (`queueAdd`/`queueRemove`).
12. **[Command Reference (All 59 Commands)](./features/commands-guide.md)**  
    Complete directory of all 59 commands across 6 categories (Info, Music, Filters, Playlist, Configuration, Developer) with subcommands and syntax.
13. **[Guild Customization & DJ System](./features/customization.md)**  
    Interactive bot nickname changer (`r!customise`), prefix management (`r!setprefix`), DJ protection (`r!dj`), and command channel whitelist (`r!whitelist`).

---

### 🏗️ System Architecture
14. **[System Architecture & Lifecycle](./architecture/overview.md)**  
    Technical architecture, ShardingManager, ReverbClient bootstrap sequence, player hierarchies, and multi-driver database repositories.
15. **[Event Dispatching & Music Events](./architecture/events.md)**  
    Routing and lifecycles of Discord gateway events (`client`, `commands`, `system`) and Moonlink audio streaming events (`node`, `player`, `queue`, `track`).

---

### 🩺 Troubleshooting & Support
16. **[Frequently Asked Questions (FAQ)](./troubleshooting/faq.md)**  
    Common questions regarding audio performance, search platforms, and hosting.
17. **[Error Solutions Guide](./troubleshooting/errors.md)**  
    Resolving `DiscordAPIError[50013]: Missing Permissions`, `ECONNREFUSED 127.0.0.1:2333`, `DisallowedIntentsError`, and missing voice permissions.

---

### 📖 About & History
18. **[The Reverb Story & Roadmap](./about/story.md)**  
    The motivation, history, lessons learned, and future roadmap behind Reverb's revival.

---

## ⚡ Quick Navigation Matrix

| Topic | Primary Guide | Key Configuration File |
| :--- | :--- | :--- |
| **First Time Setup** | [Installation Guide](./getting-started/installation.md) | `.env` |
| **Discord Permissions** | [Discord Portal Guide](./getting-started/discord-portal.md) | `config.reverb.js` |
| **Audio Server (Recommended)** | [NodeLink Setup](./getting-started/nodelink-setup.md) | `config.js` |
| **Audio Server (Java)** | [Lavalink v4 Setup](./getting-started/lavalink-setup.md) | `application.yml` |
| **Audio Client Library** | [Moonlink.js Guide](./getting-started/moonlink.md) | `config.reverb.js` |
| **Song Requests Channel** | [Setup Channel Guide](./features/setup-channel.md) | `src/events/system/setupButtons.js` |
| **All Bot Commands** | [Command Reference](./features/commands-guide.md) | `src/commands/` |
| **System Architecture** | [Architecture Overview](./architecture/overview.md) | `src/structures/` |
| **Project Story & History** | [The Reverb Story](./about/story.md) | N/A |
| **Fixing Errors** | [Error Solutions](./troubleshooting/errors.md) | N/A |

---

::: tip Ready to Get Started?
Begin with **[System Prerequisites](./getting-started/prerequisites.md)** to configure your environment.
:::

---

### 📄 License & Attribution

Reverb is released as free, open-source software under the **[Apache 2.0 License](https://github.com/CodeSuthar/Reverb/blob/main/LICENSE)**.

Copyright © 2026 — maintained by <span style="color: #FF66C4; font-weight: 600;">The Reverb Team</span> and <a href="https://github.com/CodeSuthar" target="_blank" rel="noopener noreferrer" style="color: #FF66C4; font-weight: 600;">CodeSuthar</a>.
