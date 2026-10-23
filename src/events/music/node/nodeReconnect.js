const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeReconnect",
    run: (client, node, attemptNumber) => {
        const log = client.logger || logger;
        log.info(`Reconnecting to Lavalink node: ${node.identifier} (Attempt: ${attemptNumber})`);
    }
};
