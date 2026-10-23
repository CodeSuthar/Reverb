---
title: Discord Developer Portal Setup
description: Guide to creating your Discord application, enabling privileged intents, and generating an invite link with Reverb's exact permission bits.
---

# 🤖 Discord Developer Portal Setup

[🏠 Documentation Hub](../README.md) > [Getting Started](./prerequisites.md) > **Discord Portal**

This guide walks you through registering your application on the Discord Developer Portal, retrieving your bot token, enabling the required Privileged Gateway Intents, and generating an OAuth2 invite link with exact permission bits.

::: tip Don't Want to Self-Host?
If you just want to use Reverb without setting up your own Discord Developer application or hosting an audio server, you can invite the **Official Reverb Bot** directly:
- **[Invite Official Reverb Bot](https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands)**
- **[Join Support Server](https://discord.gg/6UwVYHu2zu)**
:::

---

## 1. Create Your Application & Bot User

1. Navigate to the **[Discord Developer Portal](https://discord.com/developers/applications)** and log in with your Discord account.
2. Click the **New Application** button in the top right.
3. Enter your application name (e.g. `Reverb`) and click **Create**.
4. In the left navigation menu, click on **Bot**:
   - Under **Token**, click **Reset Token**.
   - Copy the generated token immediately and store it securely. This value corresponds to `CLIENT_TOKEN` in your `.env` file.
   - *(Optional)* Disable **Public Bot** if you only intend to host the bot for your private servers.
5. In the left navigation menu, click on **General Information**:
   - Copy the **Application ID**. This value corresponds to `CLIENT_ID` in your `.env` file.
6. In the left navigation menu, click on **OAuth2**:
   - Under **Client Information**, click **Reset Secret** (or copy your existing **Client Secret**).
   - Save this secret as `CLIENT_SECRET` in your `.env` file. This credential will be used for Discord OAuth2 user authentication and server authorization in the upcoming Reverb web dashboard.

---

## 2. Enable Privileged Gateway Intents

Discord restricts access to certain events behind privileged intent flags. Reverb requires these intents to operate properly:

1. On the **Bot** page, scroll down to the **Privileged Gateway Intents** section.
2. Enable the following switches:
   - ✅ **Presence Intent** *(Optional, enables rich presence monitoring)*
   - ✅ **Server Members Intent** *(Mandatory for role and DJ resolution)*
   - ✅ **Message Content Intent** *(MANDATORY for prefix command handling `r!play` and song requests channel text parsing)*
3. Click **Save Changes** at the bottom of the page.

::: danger Mandatory Message Content Intent
If **Message Content Intent** is disabled:
- Prefix commands (e.g. `r!play`, `r!setup`, `r!help`) will **not** trigger.
- Messages typed in the dedicated `#reverb-song-requests` channel will **not** be converted into music tracks.
:::

---

## 3. Generate Bot Invite Link

Reverb requires specific Discord permissions to create the song-requests channel, join voice channels, stream audio, manage player messages, and change its server nickname.

### Permission Calculation
Reverb's precomputed permission bitfield integer is:
```text
281891692735824
```

This bitfield grants:

| Permission | Flag Bit | Purpose |
| :--- | :--- | :--- |
| **Manage Channels** | `16` | Creating the `#reverb-song-requests` channel and category |
| **Manage Messages** | `8192` | Deleting track request messages in the setup channel and cleaning old player embeds |
| **View Channels** | `1024` | Reading channel state |
| **Send Messages** | `2048` | Sending response and player embeds |
| **Send Messages in Threads** | `274877906944` | Replying in active threads |
| **Embed Links** | `16384` | Rendering Components V2 and Embed cards |
| **Attach Files** | `32768` | Sending generated Spotify canvas and artwork cards |
| **Read Message History** | `65536` | Fetching previous track messages |
| **Use External Emojis** | `262144` | Displaying custom UI icons |
| **Use External Stickers** | `137438953472` | Expressive media support |
| **Add Reactions** | `64` | Interactive paginations |
| **Connect** | `1048576` | Joining voice channels |
| **Speak** | `2097152` | Streaming audio into voice channels |
| **Change Nickname** | `67108864` | Supporting `r!customise nick` server nicknames |
| **Set Voice Channel Status** | `281474976710656` | Setting `🎵 • Song Title` voice channel status |

### Generate the Link

::: info Official Bot Pre-built Link
To invite the officially hosted bot directly to your server:
```text
https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands
```
:::
Replace `<YOUR_CLIENT_ID>` with your Discord Application ID:
```text
https://discord.com/oauth2/authorize?client_id=<YOUR_CLIENT_ID>&permissions=281891692735824&integration_type=0&scope=bot+applications.commands
```

::: tip Applications Commands Scope
Notice the `scope=bot+applications.commands`. This scope is required so that Discord registers all 59 slash commands in servers where the bot is invited.
:::

---

## ⏭️ Next Step

Now that your Discord credentials are ready, set up your audio streaming server in **[NodeLink Audio Server Setup](./nodelink-setup.md)** *(recommended)* or **[Lavalink v4 Setup](./lavalink-setup.md)**.
