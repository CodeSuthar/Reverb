---
title: Database & Storage Layer
description: Multi-driver database architecture supporting SQLite, MongoDB, PostgreSQL, and MySQL.
---

# 💾 Database & Storage Layer

[🏠 Documentation Hub](../README.md) > [Configuration](./environment.md) > **Database Layer**

Reverb features an abstracted, multi-driver database architecture. Out of the box, it provides **zero-configuration embedded SQLite** using `better-sqlite3`, while also offering first-class support for **MongoDB (Mongoose)** and SQL databases (**PostgreSQL & MySQL** via **Drizzle ORM**).

---

## 1. Supported Database Providers

Set the `DATABASE_PROVIDER` environment variable in your `.env` file:

```dotenv
DATABASE_PROVIDER=sqlite # Options: mongodb | postgres | mysql | sqlite | pglite
```

### Provider Comparison

| Feature | SQLite (Default) | MongoDB | PostgreSQL / MySQL | PGLite |
| :--- | :--- | :--- | :--- | :--- |
| **Setup Complexity** | Zero-config (Single file) | Requires MongoDB instance/Atlas | Requires DB server + Drizzle | Zero-config embedded WASM |
| **Data Storage** | `./data/reverb.db` | Document collections | Relational tables | `./data/reverb-pgdata` |
| **Suitability** | Local / single-instance bot | Distributed sharded bots | Enterprise multi-instance bots | Embedded testing / lightweight |
| **Driver / ORM** | `better-sqlite3` | `mongoose` | `drizzle-orm`, `pg` / `mysql2` | `@electric-sql/pglite` |

---

## 2. Managed Database Entities

Regardless of the driver selected, Reverb exposes a unified async API on `client.database`:

### 1. Prefixes (`getPrefix`, `setPrefix`)
Stores custom message command prefixes per guild.

### 2. DJ System (`getDJ`, `setDJ`, `toggleDJ`, `addDJRole`, `addDJUser`)
Manages whether DJ mode is active in the server, authorized DJ roles, and authorized DJ users.

### 3. Command Whitelist (`getWhitelist`, `setWhitelist`, `toggleWhitelist`)
Controls channel restriction mode, allowed command channels, and bypass roles/users.

### 4. Song Requests Setup Channel (`getSetup`, `setSetup`, `deleteSetup`)
Tracks the dedicated channel, category, and persistent message for the server's music hub.

### 5. Custom User Playlists (`getPlaylist`, `createPlaylist`, `deletePlaylist`)
Allows users to save custom music playlists across servers with public or private visibility.

### 6. 24/7 Mode (`get247`, `set247`, `deleteTwentyFourSeven`)
Persists whether the music bot should remain connected to voice channels even when idle or alone.

---

## 3. Drizzle ORM Migrations (SQL)

If you configure PostgreSQL or MySQL, Reverb uses **Drizzle ORM** for schema definition and migrations:

::: code-group

```bash [pnpm]
# Push migrations directly to your database
pnpm run db:push

# Generate SQL migration files
pnpm run db:generate

# Open Drizzle Studio in browser to view data
pnpm run db:studio
```

```bash [npm]
# Push migrations directly to your database
npm run db:push

# Generate SQL migration files
npm run db:generate

# Open Drizzle Studio in browser to view data
npm run db:studio
```

```bash [yarn]
# Push migrations directly to your database
yarn db:push

# Generate SQL migration files
yarn db:generate

# Open Drizzle Studio in browser to view data
yarn db:studio
```

:::

---

## ⏭️ Next Step

Explore Reverb's audio features in **[Music Engine & Audio Pipeline](../features/music-system.md)**.
