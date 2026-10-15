const { ActivityType } = require("discord.js");

module.exports = {
    name: "clientReady",
    run: async (client) => {
        console.log(`[ CLIENT ] ${client.user.username} is logged in and ready to listen your commands`);

        let scount = client.guilds.cache.size;
        let mcount = 0;
        client.guilds.cache.forEach((guild) => {
            mcount += guild.memberCount;
        });

        // Status
        let statuses = [
            `With Version ${require(`${process.cwd()}/package.json`).version}`,
            `Serving ${scount} Guilds!`,
            `Serving ${mcount} Users!`,
            'In Beta'
        ];

        let updateStatus = async () => {
            let status = statuses[Math.floor(Math.random() * statuses.length)];
            await client.user.setActivity(status, { type: ActivityType.Playing });
        }

        updateStatus();

        setInterval(updateStatus, 300000); // Update status every 5 minutes

        console.log("[ DEBUG ] Starting Lavalink initialization...");

        try {
            await client.musicManager.init(client.user);
            console.log("[ DEBUG ] Lavalink initialization finished.");
        } catch (error) {
            console.error("[ DEBUG ] Lavalink initialization failed:", error);
        }

        // try { 
        //     await client.musicManager.init(client.user); 
        //     console.log("[ LAVALINK ] Manager usable:", client.musicManager.useable); 
        // } catch (error) {
        //     console.error("[ LAVALINK ] Failed to initialize:", error); 
        // } 
        
        // // List nodes and their connection status 
        // console.log("[ LAVALINK ] Node Status:"); 
        // for (const [id, node] of client.musicManager.nodeManager.nodes) { 
        //     console.log(`[ LAVALINK ] ${id}`, { host: node.options.host, port: node.options.port, connected: node.connected, alive: node.isAlive, status: node.connectionStatus, ping: node.heartBeatPing }); 
        // }
    }
}



// const isPortReachable = require("is-port-reachable");
// const { GetChoicesCommand } = require("../../Utils/Utils.js")
// const { default: DeezerExtractor } = require("discord-player-deezer");

// module.exports = {
//     name: "ready",
//     run: async (client) => {
//         console.log(`[ CLIENT ] ${client.user.username} is logged in and ready to listen your commands`);

//         let scount = client.guilds.cache.size;
//         let mcount = 0; 
//         client.guilds.cache.forEach((guild) => {
//             mcount += guild.memberCount;
//         });

//         //Game
//         let statuses = [ `With Version ${require(`${process.cwd()}/package.json`).version}`, `With 111+ Commands`, `In ${scount} Guilds!`, `With ${mcount} Users!`, 'In Beta'];
//         setInterval(function() {
//   		    let status = statuses[Math.floor(Math.random()*statuses.length)];
//   		    client.user.setActivity(status, { type: ActivityType.Playing });
//   	    }, 10000)
        
//         //Dashboard
//         if (client.config.Dashboard.ShouldRun) {
//             if (await isPortReachable(client.config.Dashboard.Port, { host: client.config.Dashboard.ReverseProxy }) === false) {
//                 require("../../Dashboard/dashboard.js")(client);
//             }
//         }

//         //Loading The Music Extractors
//         let Player = await useMainPlayer();
//         await Player.extractors.loadDefault();
//         await Player.extractors.register(DeezerExtractor);


//         client.helpArray = GetChoicesCommand();
//     }
// }