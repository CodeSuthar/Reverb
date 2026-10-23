const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeDestroy",
    run: (client, identifier) => {
        const log = client.logger || logger;
        log.warn(`Destroyed Lavalink node: ${identifier}`);
    }
};
