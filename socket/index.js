const { io } = require("../bin/www");
const socketioJwt = require('socketio-jwt')

io.on(
    "connection",
    socketioJwt.authorize({
        secret: "YXp3YXI="
    })
).on("authenticated", (socket) => {
    //this socket is authenticated, we are good to handle more events from it.
    console.log(`hello! ${socket.decoded_token.name}`);
});