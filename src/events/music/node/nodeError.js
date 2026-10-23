const logger = require("../../../utils/logger");

module.exports = {
    name: "error",
    run: (client, node, error) => {
        const log = client.logger || logger;
        log.error(`Error on Lavalink node ${node.identifier}:`, error);
    }
};
