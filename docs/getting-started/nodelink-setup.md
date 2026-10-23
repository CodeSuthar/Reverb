---
title: NodeLink Setup (Recommended)
description: Complete setup guide for NodeLink — the recommended 100% Node.js audio server for Reverb.
---

# ⚡ NodeLink Audio Server Setup (Recommended)

[🏠 Documentation Hub](../README.md) > [Getting Started](./prerequisites.md) > **NodeLink Setup**

**NodeLink** is a next-generation, high-performance, standalone audio streaming server built entirely in **Node.js** by the [PerformanC Team](https://github.com/PerformanC). It is designed as a modern, lightweight alternative to Java Lavalink for Discord music bots.

> **Official Documentation & Credits**:  
> NodeLink is developed and maintained by **PerformanC**. Visit the official website and documentation at **[https://nodelink.js.org/](https://nodelink.js.org/)** and view the source on **[GitHub](https://github.com/PerformanC/NodeLink)**.

---

## 🌟 Why Reverb Recommends NodeLink Over Lavalink

While Reverb supports both Lavalink and NodeLink, **NodeLink is the strongly recommended default engine for Reverb**:

| Feature | ⚡ NodeLink (Recommended) | ☕ Lavalink v4 |
| :--- | :--- | :--- |
| **Runtime Requirement** | **100% Pure Node.js** (No Java required) | Requires **Java 17 or 21 (JRE/JDK)** |
| **Client Synergy** | **Native first-class Moonlink.js support** | Supported via Lavalink v4 API |
| **Source Support** | **Built-in native extractors** for 15+ sources | Requires separate Java Maven plugins |
| **Memory Footprint** | Extremely low (~80 MB – 150 MB RAM) | Higher Java heap (~512 MB – 1 GB RAM) |
| **Audio Processing** | **Rust bindings & WebAssembly (WASM)** | Java Native Interface (JNI) & C wrappers |
| **Plugin Setup** | **Zero external plugins needed** | Must configure `application.yml` plugins |
| **Multi-Core Scaling** | Native multi-worker clustering | Single JVM process with thread pool |

::: tip Why Built-in Sources Matter
With Lavalink, enabling Spotify, Apple Music, Deezer, and YouTube requires downloading external Java plugins (`youtube-plugin`, `lavasrc-plugin`, `lavasearch-plugin`) and declaring Maven repository URLs. If a plugin breaks or becomes incompatible, playback fails.  
**NodeLink includes native support for all these sources out-of-the-box with zero extra plugins to configure.**
:::

---

## 📋 1. Prerequisites

Before setting up NodeLink, ensure your system has:

- **Node.js**: `>= 22.0.0` (Recommended: latest Node.js v22 LTS)
- **Git**: Latest stable release
- **C/C++ Build Tools** *(Optional, for native addon compilation)*:
  - Linux: `sudo apt install build-essential python3`
  - Windows: Visual Studio C++ Build Tools or `windows-build-tools`

---

## 📥 2. Download & Installation

### Option A: Standard Git Installation (Recommended)

1. Open your terminal or command prompt and clone the official repository:
   ```bash
   git clone https://github.com/PerformanC/NodeLink.git
   cd NodeLink
   ```

2. Install dependencies:

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

### Option B: Docker Container

If you prefer containerized deployment:

```bash
docker run -d \
  --name nodelink \
  -p 2333:2333 \
  --restart always \
  ghcr.io/performanc/nodelink:latest
```

---

## ⚙️ 3. Configuration (`config.js`)

NodeLink uses a single, clean JavaScript configuration file.

1. Copy the default configuration file:
   ```bash
   # On Linux / macOS:
   cp config.default.js config.js

   # On Windows (PowerShell):
   Copy-Item config.default.js config.js
   ```

2. Open `config.js` in your preferred text editor. Key settings to configure:

```javascript
module.exports = {
  server: {
    port: 2333,
    address: "0.0.0.0",
    password: "youshallnotpass" // Must match config.reverb.js
  },
  options: {
    maxWorkers: "auto", // Automatically scales across CPU cores
    threshold: 10000,
    playerUpdateInterval: 5000
  },
  sources: {
    youtube: true,      // Native YouTube & YouTube Music support
    spotify: {
      enabled: true,    // Direct Spotify link resolution
      market: "US"
    },
    soundcloud: {
      enabled: true
    },
    applemusic: {
      enabled: true
    },
    deezer: {
      enabled: true
    },
    bandcamp: true,
    twitch: true,
    http: true
  }
};
```

::: warning Password & Port Matching
Ensure that `server.port` (default: `2333`) and `server.password` (default: `youshallnotpass`) match the node definitions in Reverb's `config.reverb.js`.
:::

---

## 🚀 4. Starting NodeLink

### Running Directly
Start NodeLink:

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

:::

When successfully launched, you will see output similar to:
```text
[NodeLink] Ready to accept WebSocket connections on port 2333
[NodeLink] Loaded built-in sources: YouTube, Spotify, SoundCloud, AppleMusic, Deezer...
```

### Running in Background (PM2)
To keep NodeLink running 24/7 in production:

```bash
# Install PM2 globally
npm install -g pm2

# Start NodeLink with PM2
pm2 start index.js --name "nodelink"

# Save PM2 process list to restore on system reboot
pm2 save
pm2 startup
```

### Running as a Linux systemd Service
Create `/etc/systemd/system/nodelink.service`:

```ini
[Unit]
Description=NodeLink Audio Streaming Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/NodeLink
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nodelink
sudo systemctl status nodelink
```

---

## 🔍 5. Verification

Verify that NodeLink is operational and responding to HTTP requests:

```bash
curl http://localhost:2333/version
```

It should return the active NodeLink version string.

---

## 🔗 6. Connecting Reverb to NodeLink

Open Reverb's `config.reverb.js` and ensure your `music.nodes` configuration points to your NodeLink instance:

```javascript
module.exports = {
  music: {
    defaultVolume: 100,
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

When you start Reverb (`npm start` or `pnpm start`), Reverb will connect to NodeLink and log:
```text
[ MOONLINK ] Node NodeLink-Main is connected and ready!
```

---

## ⏭️ Next Step

Learn more about the client driver powering Reverb in **[Moonlink.js Client Library](./moonlink.md)**, or proceed to **[Installation & First Boot](./installation.md)**.
