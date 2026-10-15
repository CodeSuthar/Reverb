const mongoose = require("mongoose");

module.exports = async (client) => {
    try {
        await mongoose.connect(client.config.database.mongoURI, {
            autoIndex: false,
            connectTimeoutMS: 10000,
            family: 4
        });
    } catch (err) {
        console.error(`[ DATABASE ] Mongoose connection error: \n ${err.stack}` );
    }

    mongoose.connection.on('connected', () => {
        console.log(`[ DATABASE ] Database connected successfully`);
    });

    mongoose.connection.on('error', (err) => {
        console.error(`[ DATABASE ] Mongoose connection error: \n ${err.stack}` );
    });

    mongoose.connection.on('disconnected', () => {
        console.log(`[ DATABASE ] Mongoose disconnected`);
    });
}