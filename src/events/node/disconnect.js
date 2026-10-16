module.exports = {
    name: "disconnect",
    run: (node, reason) => {
        console.log(
            reason ? `[ LAVALINK ] Disconnected from node: ${node.id} | Reason: ${reason}` : `[ LAVALINK ] Disconnected from node: ${node.id}`
        )
    }
}