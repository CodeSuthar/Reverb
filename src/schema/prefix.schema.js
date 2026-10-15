const { Schema, model } = require("mongoose");

const prefixSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        required: true
    }
});

module.exports = model("prefix", prefixSchema);