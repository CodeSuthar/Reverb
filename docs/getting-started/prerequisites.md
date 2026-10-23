---
title: System Prerequisites
description: Hardware, software, and runtime requirements for running the Reverb Discord music bot with pnpm, npm, or yarn.
---

# 📦 System Prerequisites

[🏠 Documentation Hub](../README.md) > **Prerequisites**

Before installing and running **Reverb**, your system or server must meet the following hardware, runtime, and software prerequisites.

---

## 1. System Requirements

### Hardware Recommendations
- **CPU**: 1 vCPU / core minimum (2 vCPUs recommended for multi-guild servers with concurrent audio streams).
- **RAM**:
  - **Reverb Bot**: ~150 MB – 300 MB.
  - **NodeLink (Recommended)**: ~80 MB – 150 MB.
  - **Lavalink v4 (Alternative)**: ~512 MB – 1 GB (Java heap).
  - **Total Recommended**: 1 GB RAM (NodeLink) or 2 GB RAM (Lavalink).
- **Disk**: 1 GB free space for Node modules and SQLite database storage.
- **Operating System**: Linux (Ubuntu 20.04+, Debian 11+, CentOS/Rocky 8+), Windows 10/11 / Windows Server 2019+, or macOS 12+.

---

## 2. Required Software & Runtimes

| Component | Required Version | Verification Command | Official Installation Resource |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.17.0` (Recommended: `v22.x LTS`) | `node -v` | **[Node.js Official Downloads](https://nodejs.org/en/download)** • **[Package Manager Guide](https://nodejs.org/en/download/package-manager)** |
| **npm** | `v10.x`+ (Included with Node.js) | `npm -v` | **[npm Official Documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)** |
| **pnpm** | `v9.x`+ / `v10.x`+ | `pnpm -v` | **[pnpm Official Installation](https://pnpm.io/installation)** |
| **Yarn** | `v1.x` / `v4.x` | `yarn -v` | **[Yarn Official Installation](https://yarnpkg.com/getting-started/install)** |
| **Git** | `v2.30`+ | `git -v` | **[Git Official Downloads](https://git-scm.com/downloads)** |
| **Audio Server** | **NodeLink** *(Recommended)* or **Lavalink v4** | `curl http://localhost:2333/version` | **[NodeLink Setup Guide](./nodelink-setup.md)** • **[Lavalink Setup Guide](./lavalink-setup.md)** |
| **Java (JRE/JDK)** | `Java 17` or `Java 21` (64-bit) | `java -version` | **[Eclipse Adoptium Temurin (Official OpenJDK)](https://adoptium.net/temurin/releases/)** • **[Oracle Java](https://www.oracle.com/java/technologies/downloads/)** *(Lavalink only)* |

::: tip Zero-Java with NodeLink
If you use **[NodeLink](./nodelink-setup.md)** (our recommended audio server), you **do not need to install Java at all**. Everything runs on 100% pure Node.js!
:::

---

## 3. Official Installation Guides by Component

### 1. Node.js & npm (Default Method)

Node.js provides official pre-built installers and package manager setups for all major platforms:

- **Windows & macOS**:
  1. Visit the official **[Node.js Download Page](https://nodejs.org/en/download)**.
  2. Download the **LTS (Long Term Support)** installer (`.msi` for Windows, `.pkg` for macOS).
  3. Run the installer, accept the license terms, and ensure **Add to PATH** is checked.
  4. `npm` is included automatically by default.

- **Linux (Ubuntu / Debian / RHEL / Alpine)**:
  Follow the official instructions from the **[Node.js Package Manager Guide](https://nodejs.org/en/download/package-manager)**. For Debian and Ubuntu:
  ```bash
  # Update package indexes and install curl
  sudo apt update && sudo apt install -y curl

  # Install Node.js LTS via official NodeSource repository
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

---

### 2. Package Managers (pnpm, npm, yarn)

Reverb is fully compatible with all three package managers. Choose whichever you prefer:

#### Option A: pnpm (Recommended)
`pnpm` is the default package manager used by the Reverb repository for fast, disk-efficient dependency resolution. Install it via the official methods documented at **[pnpm.io/installation](https://pnpm.io/installation)**:

::: code-group

```bash [Corepack (Default)]
# Corepack comes pre-installed with official Node.js
corepack enable pnpm
corepack prepare pnpm@latest --activate
```

```bash [npm]
# Standard global install via npm
npm install -g pnpm
```

```powershell [Windows PowerShell]
# Official standalone PowerShell script
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

```bash [POSIX Shell (Linux/macOS)]
# Official standalone curl script
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

:::

#### Option B: npm (Default Node.js Bundled)
`npm` is already installed on your system if you installed Node.js. No separate setup is required. To update npm to the latest version:
```bash
npm install -g npm@latest
```
Refer to the **[npm Installation Documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)**.

#### Option C: Yarn
If you prefer Yarn, install it following the official guide at **[yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install)**:
```bash
corepack enable
corepack prepare yarn@stable --activate
# Or globally via npm:
npm install -g yarn
```

---

### 3. Java (Only Required if using Lavalink v4)

If you use **NodeLink** (recommended), skip this step entirely. If you opt for **Lavalink v4**, install an official 64-bit OpenJDK build (version 17 or 21):

- **Recommended: Eclipse Adoptium Temurin (OpenJDK)**:
  1. Visit **[Adoptium Temurin Releases](https://adoptium.net/temurin/releases/)**.
  2. Select your OS (Windows, Linux, or macOS) and architecture (`x64` or `aarch64`).
  3. Choose **JDK 17 (LTS)** or **JDK 21 (LTS)** and run the installer.
  4. Ensure **Set JAVA_HOME** and **Add to PATH** are selected during installation.
- **Alternative: Oracle Java**:
  Download from **[Oracle Java Downloads](https://www.oracle.com/java/technologies/downloads/)**.
- **Linux Package Manager**:
  ```bash
  # Debian / Ubuntu:
  sudo apt install -y openjdk-17-jre-headless

  # RHEL / CentOS:
  sudo dnf install -y java-17-openjdk-headless
  ```

---

### 4. Git

Download and install Git from the official website at **[git-scm.com/downloads](https://git-scm.com/downloads)**, or install it via your system package manager:
```bash
# Ubuntu / Debian:
sudo apt install -y git

# Fedora / RHEL:
sudo dnf install -y git
```

---

## 4. Verification

Run the following commands in your terminal or PowerShell to ensure your environment is ready:

```bash
node -v
# Output should be >= v18.17.0 (e.g. v22.11.0)

# Verify your package manager:
pnpm -v    # If using pnpm
npm -v     # If using npm
yarn -v    # If using yarn

git --version
# Output should show git version 2.x.x
```

---

## ⏭️ Next Step

Once your environment is verified, proceed to **[Discord Developer Portal Configuration](./discord-portal.md)** to register your bot application and retrieve its credentials.
