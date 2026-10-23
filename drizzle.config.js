const { defineConfig } = require("drizzle-kit");
const config = require("./config.reverb");

const provider = config.database.provider;
let dialect = "sqlite";
let schema = "./src/database/schemas/sqlite.js";
let dbCredentials = { url: config.database.sqlite.path };
let out = "./drizzle/sqlite";

if (provider === "postgres") {
    dialect = "postgresql";
    schema = "./src/database/schemas/postgres.js";
    dbCredentials = { url: config.database.postgres.url };
    out = "./drizzle/postgres";
} else if (provider === "pglite") {
    dialect = "postgresql";
    schema = "./src/database/schemas/postgres.js";
    dbCredentials = { url: config.database.pglite.dataDir };
    out = "./drizzle/postgres";
} else if (provider === "mysql") {
    dialect = "mysql";
    schema = "./src/database/schemas/mysql.js";
    dbCredentials = config.database.mysql.url
        ? { url: config.database.mysql.url }
        : {
            host: config.database.mysql.host,
            port: config.database.mysql.port,
            user: config.database.mysql.user,
            password: config.database.mysql.password,
            database: config.database.mysql.database,
        };
    out = "./drizzle/mysql";
}

module.exports = defineConfig({
    out,
    schema,
    dialect,
    dbCredentials,
});
