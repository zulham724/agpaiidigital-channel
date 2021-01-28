const { io } = require("../bin/www");
const socketioJwt = require('socketio-jwt')

// io.on(
//     "connection",
//     socketioJwt.authorize({
//         secret: "YXp3YXI="
//     })
// ).on("authenticated", (socket) => {
//     //this socket is authenticated, we are good to handle more events from it.
//     console.log(`hello! ${socket.decoded_token.name}`);
// });

io.on("connection", socket => {

    // untuk masuk ke room
    socket.on('create', function(room) {
        console.log('room joined with name', room)
        socket.join(room);
    })

    // untuk event pesan
    socket.on('message', ({ room, data }) => {
        socket.to(room).emit('message', data);
        console.log(room, data)
    })

    // untuk event mengetik
    socket.on('typing', ({ room }) => {
        socket.to(room).emit('typing', 'Someone is typing')
    })

    // untuk event stop mengetik
    socket.on('stopped_typing', ({ room }) => {
        socket.to(room).emit('stopped_typing')
    })

    // ganti event dari pusher
    socket.on('assigment_event', ({ room, data }) => {
        socket.to(room).emit('assigment_event', data)
    })

})

// io.sockets.to('notification').emit('LikedPost', 'what is going on, party people?');

// // this message will NOT go to the client defined above
// io.sockets.in('foobar').emit('message', 'anyone in this room yet?');