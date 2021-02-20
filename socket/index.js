function checkAuth(room, socket) {
    const user_id = socket.decoded_token.sub;
    const a = room.split("_").pop();
    if (a == user_id) return true;
    return false;
}
module.exports = function (server) {
    const fs = require("fs");
    const io = require("socket.io").listen(server);
    var jwt = require("@ardatamedia/ardata-jsonwebtoken");
    var cert = fs.readFileSync("oauth-public.key"); // get public key

    //https://socket.io/docs/v2/migrating-from-0-9/index.html
    // io.use(socketioJwt.authorize({
    //     secret: 'RM0SqcmpoatgzQ5JXi6aeEXYI6dSaPiWDSbTW79s',
    //     // secret: 'YXp3YXI=',
    //     handshake: true
    //   }));
    io.use((socket, next) => {
        if (socket.handshake.query.token) next();
        else {
            const err = new Error("not authorized");
            err.data = { content: "JWT harus diisi" }; // additional details
            next(err);
        }
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.query.token;
            const decoded_token = jwt.verify(token, cert, { algorithms: ["RS256"] });
            socket.decoded_token = decoded_token;
            socket.jwt = socket.handshake.query.token;
            console.log("[Auth] success auth from user_id:", decoded_token.sub);
            next();
        } catch (err) {
            // console.log('auth vailed');
            // console.log();
            next(err);
        }
    });

    io.on("connection", (socket) => {
        //this socket is authenticated, we are good to handle more events from it.
        // console.log(`hello user_id:`,socket.decoded_token.sub);

        // memberi property user_id pada client socket
        socket.user_id = socket.decoded_token.sub;
        console.log('[connection] new socket.io client:',socket.id);
       

        // console.log("client connected", new Date());
        socket.on("join", function (room) {
            // // jika client join ke room dgn prefix di bawah, maka akan dilakukan pengecekan authentication berdasarkan socket.decode_token.sub
            // const prefix_to_check = ['personal_conversation'];
            // // if(checkAuth(room,))
            console.log(
                "somebody join room",
                room,
                "with user_id",
                socket.decoded_token.sub
            );
            socket.join(room);
        });

        socket.on("join_individual_room", function (room) {
            // parameter `room` harus memiliki format `prefix_{user_id}`
            // maka akan dilakukan pengecekan authentication berdasarkan socket.decode_token.sub
            const a = room.split("_").pop();
            if (a == socket.decoded_token.sub) {
                console.log(
                    "somebody join INDIVIDUAL room",
                    room,
                    "with user_id",
                    socket.decoded_token.sub
                );
                socket.join(room);
            } else {
                console.log("User", user_id, "not authenticated with room:", room);
            }
        });
        // untuk event mengajak orang untuk listen ke room tertentu
        socket.on("invite", ({ room, data }) => {
            console.log("someone inviting...");
            socket.to(room).emit("Invite", data);
        });

        // untuk event pesan
        socket.on("message", ({ conversation, data }) => {
            try {
                console.log(
                    "send message to conversation_id ",
                    conversation.id,
                    ":",
                    data
                );
                // let receivers = [];
                // if(typeof conversation == 'object'){
                //     receivers = conversation.users.filter(e=>e.id!=data.user.id)
                //     // console.log('receivers:',receivers)
                // }

                //referensi: https://socket.io/docs/v3/rooms/
                const conversation_id = conversation.id;
                const payload = { conversation_id: conversation_id, item: data };
                const sender_room = "conversation_list_" + data.user.id;
                io.to(sender_room).emit("message", payload); //mengirim ke semua socket termasuk sender

                // mengirim ke semua user yg menjadi penerima yg join ke room conversation_list_{user_id}
                const conversation_to_receiver = {
                    ...conversation,
                    users: [{ ...data.user }],
                };
                conversation.users.forEach((user) => {
                    const individual_room = "conversation_list_" + user.id;
                    io.to(individual_room).emit("conversation", {
                        conversation: conversation_to_receiver,
                        payload: payload,
                    });
                });
                // io.to().emit()
                // mengirim event conversations_list.$user_id ke penerim

                // try{
                //     receivers.forEach(user=>{
                //         io.emit("conversation_list."+user.id, {conversation, data})
                //         console.log("conversation_list_"+user.id)
                //     });
                // }catch(err){
                //     console.log(err);
                // }

                //  mengirim data message ke microservice agar tersimpan ke db
                const postData = {
                    conversation_id: conversation_id,
                    value: data.message.value,
                };
                require("../socket/saveMessage")({
                    postData: postData,
                    jwt: socket.jwt,
                });
                // require('../socket/updateConversation')({conversation:conversation, jwt:socket.jwt}); // mengupdate data updated_at agar conversations dengan pesan paling baru di urutan atas

                // socket.to(room).emit("message", data); //hanya mengirim ke penerima

                // console.groupCollapsed(['room'],io.sockets.adapter.rooms['conversation'].sockets);
            } catch (err) {
                console.log("message EVENT error:", err);
            }
        });

        // untuk event mengetik
        socket.on("typing", ({ conversation, sender }) => {
            try {
                // socket.to(room).emit("Typing", user);
                console.log(sender, "is typing in conversation_id", conversation.id);
                // mengirim emit ke semua user participant di conversation_id
                conversation.users.forEach((user) => {
                    const receiver_room = "conversation_list_" + user.id;
                    io.to(receiver_room).emit("typing", { conversation, sender });
                });
            } catch (err) {
                console.log("typing EVENT error:", err);
            }
        });

        // untuk event stop mengetik
        socket.on("stopped_typing", ({ conversation, sender }) => {
            try{
                console.log(
                    sender,
                    "is STOPPED typing in conversation_id",
                    conversation.id
                );
                // mengirim emit ke semua user participant di conversation_id
                conversation.users.forEach((user) => {
                    const receiver_room = "conversation_list_" + user.id;
                    io.to(receiver_room).emit("stopped_typing", { conversation, sender });
                });
            }catch(err){
                console.log("stopped_typing EVENT error:", err);
            }
           
        });

        // untuk event test
        socket.on("test", ({ room }) => {
            console.log("test gan");
            // socket.to(room).emit("test");
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
};

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
