const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeResume",
    run: (client, node) => {
        const log = client.logger || logger;
        log.success(`Resumed Lavalink node: ${node.identifier}`);
    }
};
