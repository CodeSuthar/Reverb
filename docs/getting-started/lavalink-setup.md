---
title: Lavalink v4 Setup
description: Guide to installing, configuring, and running a traditional Java-based Lavalink v4 audio streaming node for Reverb.
---

# 🔊 Lavalink v4 Setup

[🏠 Documentation Hub](../README.md) > [Getting Started](./prerequisites.md) > **Lavalink Setup**

**Lavalink** is a standalone audio streaming server written in Java that handles audio fetching, transcoding, and streaming into Discord voice channels. Reverb connects to Lavalink using the **Moonlink.js** client library.

> **Official Documentation & Credits**:  
> Lavalink is an open-source project developed and maintained by the **Lavalink Devs** team.  
> - **Official Website**: **[https://lavalink.dev/](https://lavalink.dev/)**  
> - **GitHub Repository**: **[GitHub (lavalink-devs/Lavalink)](https://github.com/lavalink-devs/Lavalink)**

---

::: tip Consider NodeLink Instead!
While Reverb fully supports Lavalink v4, **[NodeLink](./nodelink-setup.md)** is strongly recommended for most users:
- **No Java required** (runs on 100% pure Node.js v22+).
- **Built-in source plugins** for YouTube, Spotify, Apple Music, Deezer, and SoundCloud without needing Maven plugin declarations.
- **Lower memory footprint** (~80 MB RAM vs Java's ~512 MB – 1 GB heap).
:::

---

## 📋 1. Prerequisites

To run Lavalink v4, your host system must have:

- **Java (JRE/JDK)**: `Java 17` or `Java 21` (64-bit).
  - Check version with: `java -version`
  - Official Downloads: **[Eclipse Adoptium Temurin Releases (Recommended)](https://adoptium.net/temurin/releases/)** or **[Oracle Java Downloads](https://www.oracle.com/java/technologies/downloads/)**
  - Linux (Ubuntu / Debian): `sudo apt install -y openjdk-17-jre-headless`
  - Linux (RHEL / CentOS): `sudo dnf install -y java-17-openjdk-headless`
- **RAM**: Minimum 1 GB available memory for the Java heap.

---

## 📁 2. Directory Structure

Create a dedicated folder for Lavalink on your machine:

```bash
mkdir lavalink
cd lavalink
```

Inside this directory, you will manage:
- `Lavalink.jar`
- `application.yml`
- `plugins/` (downloaded automatically on first startup)

---

## 📥 3. Download Lavalink v4

Download the latest stable release of `Lavalink.jar`:

- **Manual Download**: [Lavalink GitHub Releases](https://github.com/lavalink-devs/Lavalink/releases)
- **Linux Terminal Command**:
  ```bash
  curl -L -o Lavalink.jar https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar
  ```

---

## ⚙️ 4. Configuration (`application.yml`)

Create a file named `application.yml` in your `lavalink/` directory with the following configuration:

```yaml
server:
  port: 2333
  address: 0.0.0.0

lavalink:
  plugins:
    # YouTube Source Plugin
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.11.4"
      repository: "https://maven.lavalink.dev/releases"
    # LavaSearch Plugin
    - dependency: "com.github.topi314.lavasearch:lavasearch-plugin:1.0.0"
      repository: "https://maven.lavalink.dev/releases"
    # LavaSrc Plugin (Spotify, Apple Music, Deezer)
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:4.3.0"
      repository: "https://maven.lavalink.dev/releases"

  server:
    password: "youshallnotpass"
    sources:
      youtube: false # Delegated to youtube-plugin
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
    filters:
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: HIGH
    trackStuckThresholdMs: 10000
    useSeekGhosting: true
    playerUpdateInterval: 5
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true
    gc-warnings: true

plugins:
  youtube:
    enabled: true
    allowSearch: true
    allowDirectVideoIds: true
    allowDirectPlaylistIds: true
    clients:
      - MUSIC
      - ANDROID_TESTSUITE
      - WEB
      - TVHTML5EMBEDDED
  lavasrc:
    providers:
      - "ytsearch:\"%ISRC%\""
      - "ytsearch:%QUERY%"
    sources:
      spotify: true
      applemusic: false
      deezer: false
      yandex: false
    spotify:
      clientId: "YOUR_SPOTIFY_CLIENT_ID"       # Optional: for Spotify metadata
      clientSecret: "YOUR_SPOTIFY_CLIENT_SECRET" # Optional: for Spotify metadata
      countryCode: "US"
      playlistLoadLimit: 6
      albumLoadLimit: 6

logging:
  file:
    path: ./logs/lavalink.log
  level:
    root: INFO
    lavalink: INFO
```

::: warning Port and Password Matching
The `server.password` (default: `youshallnotpass`) and `server.port` (`2333`) must match your definitions in Reverb's `config.reverb.js`.
:::

---

## 🚀 5. Starting Lavalink

### Command Line
Start Lavalink using Java:

```bash
java -jar Lavalink.jar
```

Wait until Lavalink prints:
```text
Lavalink is ready to accept connections.
```

### Running in Background on Linux (systemd)
Create `/etc/systemd/system/lavalink.service`:

```ini
[Unit]
Description=Lavalink Audio Node
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/lavalink
ExecStart=/usr/bin/java -Xmx1G -jar /home/ubuntu/lavalink/Lavalink.jar
Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lavalink
sudo systemctl status lavalink
```

---

## 🔍 6. Verification

Verify that Lavalink is listening and operational:

```bash
curl http://localhost:2333/version
```

It should return the running Lavalink version (e.g. `4.0.8`).

---

## 🔗 7. Connecting Reverb to Lavalink

In `config.reverb.js`, configure the node connection:

```javascript
module.exports = {
  music: {
    defaultVolume: 100,
    nodes: [
      {
        name: "Lavalink-Node-1",
        host: "localhost",
        port: 2333,
        password: "youshallnotpass",
        secure: false
      }
    ]
  }
};
```

---

## ⏭️ Next Step

Now that your audio daemon is running, continue to **[Installation & First Boot](./installation.md)**.
