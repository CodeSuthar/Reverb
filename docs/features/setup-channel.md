---
title: Dedicated Song Requests Channel
description: How to configure and use Reverb's interactive song requests channel (r!setup create / /setup create).
---

# 📻 Dedicated Song Requests Channel

[🏠 Documentation Hub](../README.md) > [Features](./music-system.md) > **Setup Channel**

Reverb features a dedicated song requests channel (`r!setup create` / `/setup create`). In this channel, users can type song titles or links directly without any command prefix to queue music, while a persistent player card stays at the bottom, auto-updating in real time.

---

## 1. Creating the Song Requests Channel

Administrators can run either:
```text
r!setup create
```
or
```text
/setup create
```

### What Happens Behind the Scenes:
1. Reverb creates a category named **`Reverb Zone`** in the guild.
2. Reverb creates a text channel named **`reverb-song-requests`** under that category.
3. Reverb posts the initial persistent player card in the channel.
4. The IDs of the channel, category, and message are saved in the database.

::: info Permission Optimization
Reverb intentionally does **not** inject manual or restrictive `permissionOverwrites` when creating the channel. Instead, the channel cleanly inherits standard guild role permissions. This avoids Discord API error `50013: Missing Permissions` when the bot lacks hierarchical role overrides.
:::

---

## 2. Real-Time View Synchronization

The persistent player card in `#reverb-song-requests` stays synchronized with the music player at all times:

| Event Trigger | Action Taken on Setup View |
| :--- | :--- |
| **Track Starts** | Displays current song thumbnail, duration, author, and progress. |
| **Track Ends** | Cleans up previous status; if queue is empty, reverts to idle banner. |
| **Track Added to Queue** | Immediately appends newly enqueued songs to the up-next list. |
| **Track Removed / Cleared** | Refreshes up-next list immediately. |
| **Queue Ends** | Reverts setup view to idle banner. |
| **Player Paused / Resumed** | Updates pause button state in the interactive button row. |

---

## 3. Interactive Setup Buttons & DJ Protection

The persistent message includes interactive buttons (previous, pause/resume, skip, stop, loop, shuffle).

All button clicks enforce strict **DJ Mode** protection:

```text
User clicks a setup button (e.g. Skip or Pause)
   │
   ├── User is in the SAME voice channel as the bot?
   │     └── NO ➔ Ephemeral error: "You must be in my voice channel!"
   │
   ├── Is DJ Mode ON in this server?
   │     ├── NO ➔ Allow playback action.
   │     └── YES ➔ Continue DJ verification:
   │           ├── Are DJ roles or users configured? (If 0 configured, warn user)
   │           ├── Is user Bot Owner / Developer? ➔ BYPASS allowed.
   │           ├── Does user have `ManageGuild` permission? ➔ BYPASS allowed.
   │           ├── Does user have a configured DJ role or DJ user status? ➔ ALLOW action.
   │           └── Otherwise ➔ Ephemeral error: "This command requires DJ permissions!"
```

---

## 4. Deleting or Resetting the Setup Channel

To remove the dedicated channel and clean up database records:
```text
r!setup delete
# or
/setup delete
```
Reverb will delete the channel, remove the category, and erase the configuration from the database.

---

## ⏭️ Next Step

Explore all available bot commands in the **[Command Reference Guide](./commands-guide.md)**.
