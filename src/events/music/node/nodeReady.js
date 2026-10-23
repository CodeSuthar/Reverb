const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeReady",
    run: (client, node, payload) => {
        const log = client.logger || logger;
        log.success(`Lavalink node ready: ${node.identifier}`);
    }
};
