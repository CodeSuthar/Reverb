const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeCreate",
    run: (client, node) => {
        const log = client.logger || logger;
        log.info(`Lavalink node created: ${node.identifier}`);
    }
};
