const { io } = require("../app");
const socketioJwt = require("socketio-jwt");

// io.on(
//     "connection",
//     socketioJwt.authorize({
//         secret: "YXp3YXI="
//     })
// ).on("authenticated", (socket) => {
//     //this socket is authenticated, we are good to handle more events from it.
//     console.log(`hello! ${socket.decoded_token.name}`);
// });

io.on("connection", (socket) => {
    console.log("client connected");

    // untuk masuk ke room
    socket.on("join", function(room) {
        console.log("somebody create room with name ", room);
        socket.join(room);
    });

    // untuk event mengajak orang untuk listen ke room tertentu
    socket.on("invite", ({ room, data }) => {
        console.log("someone inviting...");
        socket.to(room).emit("Invite", data);
    });

    // untuk event pesan
    socket.on("message", ({ room, data }) => {
        socket.to(room).emit("Message", data);
        console.log(room, data);
    });

    // untuk event mengetik
    socket.on("typing", ({ room }) => {
        socket.to(room).emit("Typing", "Someone is typing");
    });

    // untuk event stop mengetik
    socket.on("stopped_typing", ({ room }) => {
        socket.to(room).emit("StoppedTyping");
    });
});

// router.get('/socket/test', function(req, res, next) {
//     res.render('index', { title: 'asd' })

//     socket.on('test', ({ data }) => {
//         socket.emit('test', data);
//         console.log(data)
//     })
// });

// io.sockets.to('notification').emit('LikedPost', 'what is going on, party people?');

// // this message will NOT go to the client defined above
// io.sockets.in('foobar').emit('message', 'anyone in this room yet?');