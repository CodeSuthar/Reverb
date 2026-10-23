---
title: Error Solutions Guide
description: Diagnostics and troubleshooting steps for common Discord API, intent, audio server, and permission errors.
---

# 🛠️ Error Solutions Guide

[🏠 Documentation Hub](../README.md) > [Troubleshooting](./faq.md) > **Error Solutions**

This guide provides targeted diagnostics and fixes for the most common errors encountered when hosting and operating Reverb.

---

## 1. DiscordAPIError[50013]: Missing Permissions

### Symptom:
When running `r!setup create` or `/setup create`, the bot crashes or logs:
```text
DiscordAPIError[50013]: Missing Permissions
    at GuildChannelManager.create (...)
```

### Root Cause:
1. **Permission Overwrites Conflict**: Previously, channel creation attempted to inject custom permission overwrites (`permission_overwrites`) on the `@everyone` role or bot role. If the bot's highest role is lower in the server hierarchy or lacks `ManageRoles`, Discord rejects the overwrite with `50013`.
2. **Missing `ManageMessages` Permission**: The bot needs `ManageMessages` to delete user search prompts in the setup channel.

### Solution Applied in Reverb:
1. Reverb creates the category and text channel **without** manual role overwrites, allowing the channel to cleanly inherit server default permissions.
2. Ensure the bot is invited with the updated permission bitfield **`281891692735824`** (which includes `ManageMessages` and `ManageChannels`).
3. In Discord Server Settings ➔ **Roles**, ensure the **Reverb** bot role is positioned above general member roles.

---

## 2. Error: connect ECONNREFUSED 127.0.0.1:2333

### Symptom:
```text
[ ERROR ] › Failed to connect to audio node: NodeLink-Main
[ ERROR ] › connect ECONNREFUSED 127.0.0.1:2333
```

### Root Cause:
Reverb attempted to connect to the audio server (NodeLink or Lavalink), but no process is listening on port `2333`.

### Solutions:
1. **Check if your audio server is running**:
   - Check if NodeLink or Lavalink is alive:
     ```bash
     curl http://127.0.0.1:2333/version
     ```
   - If using **NodeLink** (recommended):
     ```bash
     cd NodeLink
     npm start
     ```
   - If using **Lavalink v4**:
     ```bash
     cd lavalink
     java -jar Lavalink.jar
     ```
2. **Verify Password and Port**:
   - Check `config.js` (NodeLink) or `application.yml` (Lavalink) and ensure `server.port` matches `music.nodes[].port` in `config.reverb.js` (default `2333`).
   - Ensure the server password matches `music.nodes[].password` in `config.reverb.js` (default `youshallnotpass`).
3. **Firewall / Remote Node**:
   - If hosting the audio server on a separate VPS, verify that firewall rules allow TCP traffic on port `2333` and bind address is `0.0.0.0`.

---

## 3. DisallowedIntentsError: Privileged Intent Not Enabled

### Symptom:
```text
[FATAL] DisallowedIntentsError [DisallowedIntents]: Privileged intent provided is not allowed or is not enabled in the Developer Portal.
```

### Root Cause:
Reverb requests `GatewayIntentBits.MessageContent` and `GatewayIntentBits.GuildMembers` on startup, but one or both are switched off in the Discord Developer Portal.

### Solution:
1. Go to the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Select your application ➔ Click **Bot** in the left menu.
3. Scroll down to **Privileged Gateway Intents**.
4. Turn **ON**:
   - ✅ **Presence Intent**
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
5. Click **Save Changes** and restart Reverb.

---

## 4. Voice Connection Timeout (15000ms elapsed)

### Symptom:
```text
Moonlink.js > Node > VoiceConnection timeout after 15000ms
```

### Root Cause:
1. Discord failed to return the voice server update payload within 15 seconds.
2. The bot does not have **Connect** or **Speak** permission in the target voice channel.
3. The Discord voice region is having an outage or UDP packets are blocked.

### Solution:
1. Check voice channel permissions: Ensure Reverb's role has **Connect** and **Speak** in the voice channel or category.
2. In Server Settings ➔ Voice Channel Settings, switch the channel region from "Automatic" to a specific region (e.g. US Central or Rotterdam).
3. Ensure UDP ports are open if running behind a corporate proxy or firewall.

---

[Back to Documentation Hub](../README.md)
