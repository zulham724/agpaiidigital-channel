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
}