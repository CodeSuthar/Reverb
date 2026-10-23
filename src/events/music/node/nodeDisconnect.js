const logger = require("../../../utils/logger");

module.exports = {
    name: "nodeDisconnect",
    run: (client, node, code, reason) => {
        const log = client.logger || logger;
        let message = `Disconnected from Lavalink node: ${node.identifier || node.id}`;

        if (code || reason) {
            message += ` (${code ? `Code: ${code}` : ""} ${reason ? `Reason: ${reason}` : ""})`;
        }

        log.warn(message);
    }
};
