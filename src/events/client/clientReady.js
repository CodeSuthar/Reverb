const { ActivityType } = require("discord.js");
const logger = require("../../utils/logger");

module.exports = {
    name: "clientReady",
    run: async (client) => {
        const log = client.logger || logger;
        log.ready(`${client.user.username} is logged in and ready to listen to your commands!`);

        log.music("Initializing Music Manager...");

        try {
            await client.musicManager.init(client.user.id);
            log.success("Music Manager initialized successfully.");
        } catch (error) {
            log.error("Error initializing Music Manager:", error);
        }

        let scount = client.guilds.cache.size;
        let mcount = 0;
        client.guilds.cache.forEach((guild) => {
            mcount += guild.memberCount;
        });

        // Status
        let statuses = [
            `in version ${require(`${process.cwd()}/package.json`).version}`,
            `music in ${scount} Guilds!`,
            `serving music to ${mcount} Users!`
        ];

        let updateStatus = async () => {
            let status = statuses[Math.floor(Math.random() * statuses.length)];
            await client.user.setActivity(status, { type: ActivityType.Playing });
        };

        updateStatus();
        setInterval(updateStatus, 300000);
    }
};
