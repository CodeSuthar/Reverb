---
title: Frequently Asked Questions (FAQ)
description: Answers to common questions regarding Reverb, NodeLink, audio buffering, prefixes, and 24/7 mode.
---

# ❓ Frequently Asked Questions (FAQ)

[🏠 Documentation Hub](../README.md) > [Troubleshooting](./faq.md) > **FAQ**

---

### Q1: Should I use NodeLink or Lavalink?
**A:** We strongly recommend **[NodeLink](../getting-started/nodelink-setup.md)**:
1. **Zero Java Requirement**: Built entirely in Node.js (v22+).
2. **Native Moonlink.js Synergy**: Moonlink.js provides native, seamless compatibility with NodeLink.
3. **Built-in Sources**: Multi-source support (YouTube, Spotify, Apple Music, Deezer, SoundCloud) is built directly into NodeLink without hunting down separate Java plugins.
4. **Lower Resource Usage**: Uses ~80 MB RAM compared to Lavalink's ~512 MB – 1 GB Java heap.

---

### Q2: Why is music buffering or skipping in voice channels?
**A:** Voice audio stuttering is almost always related to:
1. **Audio Server Location**: Ensure your NodeLink or Lavalink node is hosted in a region close to your Discord server's voice region (e.g. US-East, Europe).
2. **CPU Starvation**: If hosting the audio server and the bot on a 1 vCPU machine, high traffic can cause frame drops. Increase CPU allocations.
3. **Buffer Duration**: In `config.js` or `application.yml`, ensure buffer duration is at least 5000ms.

---

### Q3: Why are YouTube searches returning no results or 429 errors?
**A:** YouTube frequently rate-limits datacenter IPs (AWS, DigitalOcean, Hetzner, OVH):
- In **NodeLink**, YouTube extractors are continuously maintained.
- In **Lavalink**, ensure you have installed the `youtube-plugin` (v1.11.4+) in `application.yml`.
- Alternatively, set `defaultPlatform: "spotify"` or `"soundcloud"` in `config.reverb.js`.

---

### Q4: How do I change the default bot prefix?
**A:**
- Globally: Change `bot.prefix` in `config.reverb.js` (default: `"r!"`).
- Per Server: Any administrator can run `r!setprefix <new_prefix>` (e.g. `r!setprefix ?`).
- Slash commands (`/play`, `/skip`, etc.) are also always available regardless of prefix.

---

### Q5: Why does the bot leave the voice channel after a few minutes?
**A:**
Reverb has an automated idle detector (`autoDestroyOnIdle: true` with a 5-minute timeout). If no tracks are played or everyone leaves the voice channel, Reverb disconnects to save server resources.
To keep Reverb in voice permanently, enable **24/7 Mode**:
```text
r!247
# or
/247
```

---

### Q6: Can I run Reverb without installing MongoDB or PostgreSQL?
**A:**
**Yes!** Reverb defaults to SQLite (`better-sqlite3`), which stores all data in a local file at `./data/reverb.sqlite` without requiring any database server installation.

---

### Q7: Is there an official hosted Reverb bot, or do I have to self-host?
**A:** You do not need to self-host! You can invite the **Official Reverb Bot** directly to your server:
- 🔗 **[Invite Official Reverb Bot](https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands)**
- 💬 **[Join Support Server](https://discord.gg/6UwVYHu2zu)**

<p align="center">
  <iframe src="https://discord.com/widget?id=1562271632209481859&theme=dark" width="350" height="500" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
</p>

---

## ⏭️ Next Step

Having errors? Visit the **[Error Solutions Guide](./errors.md)** for fixes to common issues.
