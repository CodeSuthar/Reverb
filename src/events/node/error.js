module.exports = {
    name: "error",
    run: (node) => {
        console.error(`[ LAVALINK ] Node error: ${node.id}`);
        console.error("Message:", error?.message);
        console.error("Error:", error);
    }
}