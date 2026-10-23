---
title: Moonlink.js Client Library
description: Overview and integration guide for Moonlink.js — the next-generation audio client library powering Reverb.
---

# 🌙 Moonlink.js Client Library

[🏠 Documentation Hub](../README.md) > [Getting Started](./prerequisites.md) > **Moonlink.js**

**Moonlink.js** is a modern, strictly typed, and feature-complete client library designed for building robust Discord music bots in **Node.js**. Reverb relies on Moonlink.js as its primary audio communication bridge.

> **Official Documentation & Credits**:  
> Moonlink.js is created and maintained by **1Lucas9k** and the **Ecliptia** team.  
> - **Official Documentation**: **[https://moonlink.js.org/](https://moonlink.js.org/)**  
> - **Source Code Repository**: **[GitHub (Ecliptia/moonlink.js)](https://github.com/Ecliptia/moonlink.js)**

---

## 🎯 Key Advantages of Moonlink.js

Moonlink.js was chosen for Reverb due to its modern architecture, outstanding developer ergonomics, and native synergy with modern audio daemons:

### 1. Native NodeLink & Lavalink Synergy
While traditional audio libraries were designed solely around Java Lavalink, Moonlink.js features **native first-class support for NodeLink**, as well as full compatibility with **Lavalink v4**. This enables Reverb to communicate seamlessly with whichever audio daemon you choose.

### 2. High-Performance Queue Engine
- Built-in track queue handling with automatic track progression.
- Loop modes: single track, entire queue, and autoplay.
- Dynamic shuffling and fairplay queue algorithms.
- Playback history tracking for instant track replay.

### 3. Real-Time Hardware Audio Filters
Moonlink.js interfaces directly with node audio processing pipelines, providing zero-latency filters:
- **8D Audio** (surround spatial rotation)
- **Bassboost** (multi-band low-frequency equalization)
- **Nightcore & Vaporwave** (pitch & timescale manipulation)
- **Tremolo & Vibrato** (depth & frequency modulation)
- **15-Band Graphic Equalizer**

### 4. Enterprise Connection Stability
- **Smart Reconnection**: Automatic voice state recovery when Discord gateway reconnects.
- **Node Failover**: Dynamic least-load node balancing across multi-node clusters.
- **Stalled Track Detection**: Automatic recovery if an audio source hangs or stops streaming chunks.

---

## ⚙️ How Reverb Configures Moonlink.js

In Reverb, audio configuration is centralized in **`config.reverb.js`**:

```javascript
module.exports = {
  music: {
    defaultVolume: 100,
    searchPlatform: "youtubemusic", // Default search engine
    nodes: [
      {
        name: "NodeLink-Main",
        host: "localhost",
        port: 2333,
        password: "youshallnotpass",
        secure: false
      }
    ]
  }
};
```

::: tip Multi-Node High Availability
You can define multiple nodes in the `nodes` array. Moonlink.js automatically distributes playback sessions across all available nodes based on CPU usage and player count (`leastLoad` strategy). If one node goes offline, players are dynamically transferred to an active node without user intervention.
:::

---

## 🎧 Supported Search Platforms

Moonlink.js natively translates search requests into standard node queries:

| Prefix | Platform | Example Command |
| :--- | :--- | :--- |
| `ytsearch:` | YouTube standard search | `r!play never gonna give you up` |
| `ytmsearch:` | YouTube Music high-quality | `r!play lofi beats to relax` |
| `scsearch:` | SoundCloud streaming | `r!play soundcloud track title` |
| `spsearch:` | Spotify track resolution | `r!play https://open.spotify.com/track/...` |
| `amsearch:` | Apple Music track resolution | `r!play https://music.apple.com/...` |
| `dzsearch:` | Deezer track resolution | `r!play https://www.deezer.com/...` |
| Direct URL | Direct HTTP / MP3 / FLAC stream | `r!play https://example.com/audio.mp3` |

---

## 📚 Official Resources

To learn more about Moonlink.js, review tutorials, or contribute to its development:

- **Official Guides**: [https://moonlink.js.org/](https://moonlink.js.org/)
- **NPM Package**: [https://www.npmjs.com/package/moonlink.js](https://www.npmjs.com/package/moonlink.js)
- **GitHub Repository**: [https://github.com/Ecliptia/moonlink.js](https://github.com/Ecliptia/moonlink.js)
- **Discord Community**: Accessible via the official Moonlink documentation.

---

## ⏭️ Next Step

Proceed to **[Installation & First Boot](./installation.md)** to install project dependencies and start Reverb.
