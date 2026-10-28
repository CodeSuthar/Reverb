---
title: Complete Command Reference Guide
description: Comprehensive directory of all 59 dual-compatible message and slash commands in Reverb.
---

# 📜 Command Reference Guide (All 59 Commands)

[🏠 Documentation Hub](../README.md) > [Features](./music-system.md) > **Command Reference**

Reverb provides **59 dual-compatible commands** accessible via message prefix (e.g. `r!play`) and slash commands (e.g. `/play`). Subcommands like `playlist`, `dj`, `whitelist`, and `setup` are supported natively across both interfaces.

---

## 📑 Command Categories

- [🎵 Music Playback (24)](#-music-playback-commands)
- [🎛️ Audio Filters (15)](#️-audio-filter-commands)
- [⚙️ Configuration (6)](#️-configuration-commands)
- [📂 Playlists (1)](#-playlist-management)
- [ℹ️ Information (6)](#ℹ️-information-commands)
- [🛠️ Utility & Developer (7)](#️-utility--developer-commands)

---

## 🎵 Music Playback Commands

| Command | Slash Equivalent | Usage | DJ Role Required? | Description |
| :--- | :--- | :--- | :---: | :--- |
| `play` | `/play <query>` | `r!play <song name / URL>` | No | Searches and queues audio from YouTube, Spotify, SoundCloud, etc. |
| `playnext` | `/playnext <query>` | `r!playnext <query>` | No | Enqueues a track to play immediately after the current song finishes. |
| `pause` | `/pause` | `r!pause` | **Yes** | Pauses the active audio stream. |
| `resume` | `/resume` | `r!resume` | **Yes** | Resumes a paused audio stream. |
| `skip` | `/skip` | `r!skip` | **Yes** | Skips the currently playing track. |
| `skipto` | `/skipto <position>` | `r!skipto <number>` | **Yes** | Skips directly to a specific track index in the queue. |
| `stop` | `/stop` | `r!stop` | **Yes** | Stops playback, flushes the queue, and leaves the channel. |
| `queue` | `/queue [page]` | `r!queue [page]` | No | Interactive paginated list of all tracks currently queued. |
| `nowplaying` | `/nowplaying` | `r!nowplaying` | No | Real-time progress bar, track art, requester, and duration. |
| `volume` | `/volume [level]` | `r!volume [1-100]` | **Yes** | Adjusts player output volume. |
| `loop` | `/loop <mode>` | `r!loop <track\|queue\|off>`| **Yes** | Toggles looping for the current song or entire playlist. |
| `shuffle` | `/shuffle` | `r!shuffle` | **Yes** | Randomizes the queue order using Fisher-Yates algorithm. |
| `seek` | `/seek <time>` | `r!seek <1m30s \| 90>` | **Yes** | Fast-forwards or rewinds to a timestamp in the track. |
| `lyrics` | `/lyrics [song]` | `r!lyrics [query]` | No | Fetches synchronized or static lyrics from LRCLIB. |
| `autoplay` | `/autoplay` | `r!autoplay` | **Yes** | Automatically queues related songs when playlist ends. |
| `clearqueue` | `/clearqueue` | `r!clearqueue` | **Yes** | Deletes all upcoming tracks from the queue. |
| `remove` | `/remove <pos>` | `r!remove <number>` | **Yes** | Removes a specific track by its position in the queue. |
| `move` | `/move <from> <to>` | `r!move <3> <1>` | **Yes** | Repositions a track within the queue. |
| `replay` | `/replay` | `r!replay` | **Yes** | Restarts playback of the current track from 0:00. |
| `grab` | `/grab` | `r!grab` | No | Direct-messages the user with full details of the playing song. |
| `search` | `/search <query>` | `r!search <query>` | No | Displays interactive selection of top 10 search results. |
| `join` | `/join` | `r!join` | No | Connects the bot to your current voice channel. |
| `leave` | `/leave` | `r!leave` | **Yes** | Disconnects the bot from voice. |
| `fairplay` | `/fairplay` | `r!fairplay` | **Yes** | Reorders queue in round-robin fashion so no single user monopolizes playback. |

---

## 🎛️ Audio Filter Commands

All filter commands require DJ privileges when DJ Mode is enabled:

| Command | Usage | Effect |
| :--- | :--- | :--- |
| `bassboost` | `r!bassboost [low\|med\|high]` | Multiplies lower audio frequencies (20-125Hz). |
| `nightcore` | `r!nightcore` | Accelerates tempo and raises vocal pitch. |
| `vaporwave` | `r!vaporwave` | Decelerates tempo and drops audio pitch. |
| `8d` | `r!8d` | Creates an immersive 360-degree rotating stereo effect. |
| `karaoke` | `r!karaoke` | Attenuates center vocals for instrumental sing-along. |
| `treblebass` | `r!treblebass` | Boosts both high and low audio registers. |
| `pop` | `r!pop` | Optimized frequency curve for modern pop tracks. |
| `soft` | `r!soft` | Softens harsh treble for mellow listening. |
| `doubletime`| `r!doubletime` | Doubles track tempo. |
| `chipmunk` | `r!chipmunk` | High-pitched vocal effect. |
| `darthvader`| `r!darthvader` | Low-pitched robotic vocal effect. |
| `daycore` | `r!daycore` | Heavy pitch-down atmospheric filter. |
| `earrape` | `r!earrape` | Extreme volume gain (use with caution). |
| `filters` | `r!filters` | Displays status of all active DSP audio filters. |
| `reset` | `r!reset` | Clears all active filters back to normal. |

---

## ⚙️ Configuration Commands

| Command | Subcommands | Usage | Required Permission |
| :--- | :--- | :--- | :--- |
| `setup` | `create`, `delete` | `r!setup create` / `/setup create` | `ManageGuild`, `ManageChannels`, `ManageMessages` |
| `customise` | `nick`, `status` | `r!customise nick [name]` | `ManageGuild` |
| `dj` | `add`, `remove`, `role`, `user`, `toggle`, `list`, `clear` | `r!dj add <@role\|@user>` / `/dj` | `ManageGuild` |
| `setprefix` | `<new_prefix>` | `r!setprefix <prefix>` | `ManageGuild` |
| `247` | `<enable\|disable>` | `r!247` / `/247` | `ManageGuild` |
| `whitelist` | `add`, `remove`, `channel`, `role`, `user`, `toggle`, `list`, `clear` | `r!whitelist add <#channel\|@role\|@user>` / `/whitelist` | `ManageGuild` |

---

## 📂 Playlist Management

Reverb offers a full personal playlist suite with **Public / Private visibility protection** under `r!playlist` and `/playlist`:

```text
r!playlist create <name> [public|private] - Creates a new playlist (default: public)
r!playlist privacy <name> [public|private]- Toggles or sets playlist visibility
r!playlist add <name> [song]              - Adds a track or current playing song
r!playlist remove <name> <position>       - Removes a track by position number
r!playlist list [@user | name]            - Lists playlists (public in reply, private in DMs)
r!playlist load <name>                    - Loads and queues all playlist songs
r!playlist steal <@user> <name> [new_name]- Clones a public playlist (private cannot be cloned)
r!playlist delete <name>                  - Permanently deletes a playlist
```

::: tip Privacy Rules
- **Private playlists** are strictly **unclonable**; other users cannot steal or copy them.
- When running `playlist list` on another user, only their **public playlists** are displayed.
- When running `playlist list` on yourself, your **private playlists** are securely sent to your Direct Messages (DMs), while your public playlists are displayed in the channel reply.
:::

---

## ℹ️ Information Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `help` | `r!help [command]` | Interactive help menu with dropdowns and command details. |
| `botinfo` | `r!botinfo` | Displays bot statistics, latency, uptime, memory, and audio cluster status. |
| `about` | `r!about` | Developer credits, open-source license, and framework information. |
| `ping` | `r!ping` | Measures WebSocket ping, message round-trip, and audio node ping. |
| `invite` | `r!invite` | Generates official bot invite link with permissions `281891692735824`. |
| `api` | `r!api` | Discord REST and Gateway latency benchmarks. |

---

## 🛠️ Utility & Developer Commands

Restricted to users listed in `OWNER_IDS`:

| Command | Usage | Description |
| :--- | :--- | :--- |
| `eval` | `r!eval <code>` | Executes raw JavaScript directly in bot context. |
| `restart` | `r!restart` | Performs safe graceful client reload. |
| `shutdown`| `r!shutdown` | Terminates bot and safely disconnects audio nodes. |
| `guildlist`| `r!guildlist` | Lists all servers where Reverb is currently a member. |
| `guildleave`| `r!guildleave <id>` | Forces the bot to leave a specified server. |
| `createinvite`| `r!createinvite <id>` | Generates a temporary server invite for debugging. |
| `deleteinvites`| `r!deleteinvites <id>` | Cleans bot-created invites. |

---

## ⏭️ Next Step

Read about guild customization, DJ protection, and channel lockdown in **[Guild Customization & DJ System](./customization.md)**.
