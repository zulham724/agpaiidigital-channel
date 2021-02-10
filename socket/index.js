module.exports = function(server){
    const io = require("socket.io").listen(server);
    const socketioJwt = require("socketio-jwt");

    //https://socket.io/docs/v2/migrating-from-0-9/index.html
    io.use(socketioJwt.authorize({
        secret: 'RM0SqcmpoatgzQ5JXi6aeEXYI6dSaPiWDSbTW79s',
        // secret: 'YXp3YXI=',
        handshake: true
      }));

    io.on("connection", (socket) => {
        //this socket is authenticated, we are good to handle more events from it.
        console.log(`hello!`,socket.decoded_token);
    
        console.log("client connected", new Date());
          socket.on("join", function(room) {
            console.log("somebody join room", room,'with user_id',socket.decoded_token.sub);
            socket.join(room);
        });
    
        // untuk event mengajak orang untuk listen ke room tertentu
        socket.on("invite", ({ room, data }) => {
            console.log("someone inviting...");
            socket.to(room).emit("Invite", data);
        });
    
        // untuk event pesan
        socket.on("message", ({ room, data }) => {
            //referensi: https://socket.io/docs/v3/rooms/
            const conversation_id = room.split("_").pop();
            const payload = {conversation_id:conversation_id, item:data};
            io.to(room).emit("message", payload); //mengirim ke semua socket
            // socket.to(room).emit("message", data); //hanya mengirim ke penerima
            console.log('send message to ',room,':', data);
        });
    
        // untuk event mengetik
        socket.on("typing", ({ room, user}) => {
            // socket.to(room).emit("Typing", user);
            console.log(user, 'is typing in room',room);
            socket.to(room).emit("typing", {room,user});
        });
    
        // untuk event stop mengetik
        socket.on("stopped_typing", ({ room, user }) => {
            console.log(user, 'is STOPPED typing in room',room);
            socket.to(room).emit("stopped_typing", {room,user});
        });

         // untuk event test
         socket.on("test", ({ room }) => {
             console.log('test gan')
            socket.to(room).emit("test");
        });
    });
    // io.on("connection", (socket) => {
    //     console.log("client connected", new Date());
    //       socket.on("join", function(room) {
    //         console.log("somebody create room with name ", room);
    //         socket.join(room);
    //     });
    
    //     // untuk event mengajak orang untuk listen ke room tertentu
    //     socket.on("invite", ({ room, data }) => {
    //         console.log("someone inviting...");
    //         socket.to(room).emit("Invite", data);
    //     });
    
    //     // untuk event pesan
    //     socket.on("message", ({ room, data }) => {
    //         socket.to(room).emit("Message", data);
    //         console.log(room, data);
    //     });
    
    //     // untuk event mengetik
    //     socket.on("typing", ({ room }) => {
    //         socket.to(room).emit("Typing", "Someone is typing");
    //     });
    
    //     // untuk event stop mengetik
    //     socket.on("stopped_typing", ({ room }) => {
    //         socket.to(room).emit("StoppedTyping");
    //     });
    // });
    return io;
}

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