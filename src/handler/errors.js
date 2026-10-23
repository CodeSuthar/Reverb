const logger = require("../utils/logger");

module.exports = async (client) => {
    const log = client.logger || logger;

    client.on("disconnect", () => log.warn(`Client ${client.user?.username || "Bot"} is disconnecting...`));
    client.on("reconnecting", () => log.info(`Client ${client.user?.username || "Bot"} is reconnecting...`));
    client.on("warn", (error) => log.warn(error));
    client.on("error", (error) => log.error("Client Error:", error));
    process.on("unhandledRejection", (error) => log.error("Unhandled Rejection:", error));
    process.on("uncaughtException", (error) => log.error("Uncaught Exception:", error));

    const handleShutdown = async (signal) => {
        log.info(`Received ${signal}. Shutting down gracefully...`);
        if (client.database) {
            try {
                await client.database.disconnect();
                log.success("Database disconnected cleanly.");
            } catch (err) {
                log.error("Error during database shutdown disconnect:", err);
            }
        }
        process.exit(0);
    };

    process.once("SIGINT", () => handleShutdown("SIGINT"));
    process.once("SIGTERM", () => handleShutdown("SIGTERM"));
};
