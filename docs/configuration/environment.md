---
title: Environment Variables (.env)
description: Complete reference for environment variables and secrets in Reverb matching .env.example.
---

# 🔐 Environment Variables (.env)

[🏠 Documentation Hub](../README.md) > [Configuration](./environment.md) > **Environment Variables**

Reverb uses environment variables defined in a `.env` file at the root of the project to securely load Discord credentials and database connection options.

All static bot settings (such as the default prefix, developer IDs, and audio streaming nodes) are configured in [`config.reverb.js`](./bot-config.md).

---

## 1. Complete Variable Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `CLIENT_ID` | **Yes** | *None* | The Discord Application (Client) ID from the Developer Portal. |
| `CLIENT_SECRET` | Cond. | *None* | The Discord OAuth2 Client Secret (used for the upcoming web dashboard). |
| `CLIENT_TOKEN` | **Yes** | *None* | The Discord Bot Token generated in the Developer Portal. |
| `DATABASE_PROVIDER` | No | `sqlite` | Database engine selection: `sqlite`, `mongodb`, `postgres`, `mysql`, or `pglite`. |
| `MONGO_URI` | Cond. | `mongodb://127.0.0.1:27017/reverb` | Connection string for MongoDB (used when `DATABASE_PROVIDER="mongodb"`). |
| `POSTGRES_URL` | Cond. | `postgres://postgres:postgres@localhost:5432/reverb` | Connection URL for PostgreSQL (used when `DATABASE_PROVIDER="postgres"`). |
| `MYSQL_URL` | Cond. | *None* | Connection URL for MySQL (used when `DATABASE_PROVIDER="mysql"`). |
| `SQLITE_PATH` | No | `./data/reverb.db` | File path where the local SQLite database file is stored. |
| `PGLITE_DATA_DIR` | No | `./data/reverb-pgdata` | Data directory for the local PGLite embedded database. |
| `DATABASE_URL` | No | *None* | Optional unified connection URL; auto-detected if `DATABASE_PROVIDER` is not specified. |
| `MAIN_COLOR` | No | `#FF66C4` | Optional brand accent hex color override for embeds and UI containers. |

::: info Where are Audio Nodes and Bot Prefix Configured?
Audio streaming nodes (**NodeLink** and **Lavalink**) and the default command prefix are configured in **[`config.reverb.js`](./bot-config.md)** under `music.nodes` and `bot.prefix`, keeping connection clustering and player options cleanly organized.
:::

---

## 2. `.env.example` Template

Reverb includes a ready-to-use template in `.env.example`:

```dotenv
CLIENT_ID=
CLIENT_SECRET=
CLIENT_TOKEN=

# Database selection: mongodb | postgres | mysql | sqlite | pglite
# If left empty, will auto-detect from MONGO_URI, DATABASE_URL, or default to sqlite
DATABASE_PROVIDER=sqlite

# Provider specific options:
MONGO_URI=mongodb://127.0.0.1:27017/reverb
# POSTGRES_URL=postgres://postgres:postgres@localhost:5432/reverb
# MYSQL_URL=mysql://root:password@localhost:3306/reverb
# SQLITE_PATH=./data/reverb.db
# PGLITE_DATA_DIR=./data/reverb-pgdata
```

---

## 3. Best Practices & Security

1. **Never commit `.env` to version control**:
   The `.gitignore` file is pre-configured to ignore `.env`. Keep your bot token and database credentials private.
2. **Rotating Compromised Tokens**:
   If your `CLIENT_TOKEN` is accidentally pushed or leaked, visit the Discord Developer Portal immediately and click **Reset Token**.
3. **Developer Permissions**:
   To grant users permission to run developer commands or bypass DJ restrictions, configure their Discord User IDs in `config.reverb.js` under `bot.developerIds`.

---

## ⏭️ Next Step

Proceed to **[Bot Configuration (config.reverb.js)](./bot-config.md)** to configure audio nodes, developer IDs, UI colors, and emojis.
