const devLogger = require("../../../lib/devLogger");
module.exports = function (socket, io) {

    // socket.on('getSocketReceiver', async({receiver_id}, callback)=>{
    //     try{
    //         socket.emit('m', {socket_sender: socket.id});
    //     }catch(err){
    //         callback({error:err.message});
    //     }
    // });
    // user_id = user_id penerima
    // RtcSessionDescription = 
    socket.on('offer', async ({sender_id, receiver_id, sdp})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('offer', {sender_id, receiver_id, sdp});
        devLogger('[offer] sdp:',sdp);
    });

    socket.on('candidate', async ({sender_id, receiver_id, candidate})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('candidate', {sender_id, receiver_id, candidate});
        devLogger('[candidate]',{sender_id, receiver_id, candidate});
    });

    socket.on('answer_offer', async ({sender_id, receiver_id, sdp})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('answer_offer', {sender_id, sdp});
        devLogger('[answer_offer] sdp:',sdp);
    });

     // event jika pengirim menghentikan panggilan telefon
    socket.on('hangup', async ({sender_id, receiver_id})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('hangup', {receiver_id, sender_id});
        devLogger('[hangup] params:',{receiver_id, sender_id});
    });

    socket.on('incoming_call', async ({sender, receiver_id})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('incoming_call', {receiver_id, sender});
        devLogger('[incoming_call] params:',{receiver_id, sender});
    });

     // event jika penerima menolak mengangkat telefon. event ini dikirim ke pengirim telefon
    socket.on('reject_incoming_call', async ({sender_id, receiver_id})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('reject_incoming_call', {receiver_id, sender_id});
        devLogger('[reject_incoming_call] params:',{receiver_id, sender_id});
    });

     // event jika penerima menerima mengangkat telefon. event ini dikirim ke pengirim telefon
     socket.on('answer_incoming_call', async ({sender_id, receiver_id})=>{
        const room = 'phone_'+receiver_id;
        socket.to(room).emit('answer_incoming_call', {receiver_id, sender_id});
        devLogger('[answer_incoming_call] params:',{receiver_id, sender_id});
    });
}