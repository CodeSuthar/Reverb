const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeReconnecting",
    run: (client, node) => {
        const log = client.logger || logger;
        log.info(`Reconnecting to Lavalink node: ${node.identifier}...`);
    }
};
