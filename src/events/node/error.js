module.exports = {
    name: "error",
    run: (node, error, payload) => {
        console.error(`[ NODE ERROR ] Node ${node.options.identifier} encountered an error: \n ${error.stack}`);
        console.error(`[ NODE ERROR ] Payload: \n ${JSON.stringify(payload, null, 2)}`);
    }
}