const devLogger = require("../../../lib/devLogger");
module.exports = function(socket, io){
     // console.log("client connected", new Date());
     socket.on("join", function (room) {
        // // jika client join ke room dgn prefix di bawah, maka akan dilakukan pengecekan authentication berdasarkan socket.decode_token.sub
        // const prefix_to_check = ['personal_conversation'];
        // // if(checkAuth(room,))
        console.log("[join] user_id ", socket.decoded_token.sub, " join room:",
            room,
        );
        socket.join(room);
    });

    socket.on("join_individual_room", function (room) {
        // parameter `room` harus memiliki format `prefix_{user_id}`
        // maka akan dilakukan pengecekan authentication berdasarkan socket.decode_token.sub
        const a = room.split("_").pop();
        if (a == socket.decoded_token.sub) {
            console.log("[join] user_id ", socket.decoded_token.sub, " join INDIVIDUAL room:",
                room,
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
                "[message] to conversation_id ",
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
            require("../..//saveMessage")({
                postData: postData,
                jwt: socket.jwt,
            });
            // require('../socket/updateConversation')({conversation:conversation, jwt:socket.jwt}); // mengupdate data updated_at agar conversations dengan pesan paling baru di urutan atas

            // socket.to(room).emit("message", data); //hanya mengirim ke penerima

            // console.groupCollapsed(['room'],io.sockets.adapter.rooms['conversation'].sockets);
        } catch (err) {
            console.log("[message] EVENT error:", err.name);
        }
    });

    // untuk event mengetik
    socket.on("typing", ({ conversation, sender }) => {
        try {
            // socket.to(room).emit("Typing", user);
            console.log('[typing]', sender, "is typing in conversation_id", conversation.id);
            // mengirim emit ke semua user participant di conversation_id
            conversation.users.forEach((user) => {
                const receiver_room = "conversation_list_" + user.id;
                io.to(receiver_room).emit("typing", { conversation, sender });
            });
        } catch (err) {
            if(process.env.APP_DEV=='true') console.log("[typing] EVENT error:", err);
        }
    });

    // untuk event stop mengetik
    socket.on("stopped_typing", ({ conversation, sender }) => {
        try {
            devLogger('[stopped_typing]',
                sender,
                "is STOPPED typing in conversation_id",
                conversation.id
            );
            // mengirim emit ke semua user participant di conversation_id
            conversation.users.forEach((user) => {
                const receiver_room = "conversation_list_" + user.id;
                io.to(receiver_room).emit("stopped_typing", { conversation, sender });
            });
        } catch (err) {
            devLogger("[stopped_typing[] EVENT error:", err);
        }

    });

    // untuk event test
    socket.on("test", ({ room }) => {
        console.log("test gan");
        // socket.to(room).emit("test");
    });

    // untuk event read_conversation
    socket.on('read_conversation', ({ conversation_id }) => {
        console.log("[read_conversation] conversation id:", conversation_id);
        require("../../readConversation")({
            conversation_id: conversation_id,
            jwt: socket.jwt,
        }, (data) => {
            console.log('[read_conversation] response from server:', data);
            const user_id = socket.decoded_token.sub;
            const payload = { conversation_id: conversation_id, unread_conversations: data.unread_conversations,read_at: data.read_at, read_chats: data.read_chats }
            io.to(`conversation_list_${user_id}`).emit('read_conversation', payload);
        });
    });
}