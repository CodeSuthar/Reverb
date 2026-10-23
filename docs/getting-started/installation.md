---
title: Installation & First Boot
description: Step-by-step guide to cloning, configuring, and starting Reverb with pnpm, npm, or yarn.
---

# 🚀 Installation & First Boot

[🏠 Documentation Hub](../README.md) > [Getting Started](./prerequisites.md) > **Installation**

Follow these instructions to clone the Reverb repository, install dependencies using your package manager of choice (**pnpm**, **npm**, or **yarn**), configure your environment, and launch the bot.

---

## 1. Clone the Repository

Clone the Reverb repository from GitHub:

```bash
git clone https://github.com/CodeSuthar/Reverb.git
cd Reverb
```

---

## 2. Install Project Dependencies

Reverb is fully compatible with **pnpm**, **npm**, and **yarn**. Choose your preferred package manager:

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

---

## 3. Configure the Environment

Copy the example `.env` file:

::: code-group

```bash [Linux / macOS]
cp .env.example .env
```

```powershell [Windows (PowerShell)]
Copy-Item .env.example .env
```

:::

Open `.env` in your preferred text editor (e.g. `nano .env` or VS Code) and populate your credentials:

```dotenv
CLIENT_ID=your_discord_client_id
CLIENT_SECRET=your_discord_client_secret
CLIENT_TOKEN=your_discord_bot_token

# Database selection: mongodb | postgres | mysql | sqlite | pglite
# If left empty, will auto-detect from MONGO_URI, DATABASE_URL, or default to sqlite
DATABASE_PROVIDER=sqlite

# Provider specific options (optional):
MONGO_URI=mongodb://127.0.0.1:27017/reverb
# POSTGRES_URL=postgres://postgres:postgres@localhost:5432/reverb
# MYSQL_URL=mysql://root:password@localhost:3306/reverb
# SQLITE_PATH=./data/reverb.db
# PGLITE_DATA_DIR=./data/reverb-pgdata
```

*(For full details on every environment variable, see the [Environment Variables Guide](../configuration/environment.md).)*

---

## 4. Run First-Time Setup & Migrations

- **SQLite (Default)**: Reverb will automatically generate the database file at `./data/reverb.db` and initialize all tables on startup. No manual migration command is needed!
- **PostgreSQL / MySQL (Drizzle ORM)**: If using an external SQL database, push the table schemas:

::: code-group

```bash [pnpm]
pnpm run db:push
```

```bash [npm]
npm run db:push
```

```bash [yarn]
yarn db:push
```

:::

---

## 5. Start the Bot

### In Development Mode

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

```bash [node (direct)]
node index.js
```

:::

### In Production Mode (using PM2)
To keep Reverb running continuously in the background and auto-restart on crashes or system reboots:

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Start Reverb
pm2 start index.js --name "reverb-bot"

# 3. View live logs
pm2 logs reverb-bot

# 4. Save PM2 state to auto-launch on system startup
pm2 save
pm2 startup
```

---

## 6. Verifying Console Output

When Reverb starts successfully, you will see clean logs in your terminal:

```text
[ 02:37:16 ] [ DATABASE ] › SQLite database initialized at ./data/reverb.db
[ 02:37:17 ] [ COMMAND  ] › Successfully loaded 59 message commands
[ 02:37:17 ] [ COMMAND  ] › Successfully loaded 59 slash commands (/)
[ 02:37:17 ] [ HANDLER  ] › Successfully initialized all 4 core handler systems
[ 02:37:18 ] [ READY    ] › Reverb is logged in and ready to listen to your commands!
[ 02:37:18 ] [ MUSIC    ] › Initializing Music Manager...
[ 02:37:18 ] [ SUCCESS  ] › Node ready: NodeLink-Main
[ 02:37:18 ] [ SUCCESS  ] › Connected to audio node: NodeLink-Main
[ 02:37:18 ] [ SUCCESS  ] › Successfully reloaded application (/) commands.
```

---

## ⏭️ Next Step

Learn how to customize every aspect of the bot in the **[Configuration Guides](../configuration/environment.md)**.
