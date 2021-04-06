const { default: axios } = require("axios");
const devLogger = require("../lib/devLogger");
const chatModule = require("./onconnection/chat/index");
const mediasoupModule = require("./onconnection/mediasoup");
function checkAuth(room, socket) {
    const user_id = socket.decoded_token.sub;
    const a = room.split("_").pop();
    if (a == user_id) return true;
    return false;
}
module.exports = async function (server, { mediasoupObj }) {
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
            // console.log("[Auth] success auth from user_id:", decoded_token.sub);
            devLogger("[Auth] success auth from user_id:", decoded_token.sub);
            next();
        } catch (err) {
            // console.log('auth vailed');
            // console.log();
            devLogger('[Auth] Failed: ', err);
            next(err);
        }
    });

    io.on("connection", (socket) => {
        //this socket is authenticated, we are good to handle more events from it.
        // console.log(`hello user_id:`,socket.decoded_token.sub);

        
        // memberi property user_id pada client socket
        socket.user_id = socket.decoded_token.sub;
        devLogger('[connection] new socket.io client:', socket.id);

        chatModule(socket, io);
        mediasoupModule(socket, {mediasoupObj:mediasoupObj});

        socket.on("disconnect",()=>{
            devLogger('[disconnect] user_id',socket.decoded_token.sub,' disconnect');

            const user_id = parseInt(socket.decoded_token.sub);

            if(mediasoupObj.broadcasters.has(user_id)){
                mediasoupObj.closeProducer({broadcaster_user_id:user_id})
            }
            

            // hapus dari broadcasters jika user disconnect
            

            try{

                if(mediasoupObj.broadcasters.has(user_id)){
                    const broadcaster = mediasoupObj.broadcasters.get(user_id);
                    devLogger('producer id to removed:',broadcaster.audioProducer.id, broadcaster.videoProducer.id)
                    // close producer
                    broadcaster.audioProducer.close();
                    broadcaster.videoProducer.close();
                    // close transport

                }
                
            }catch(e){
                devLogger('error',e);
            }

            const is_removed = mediasoupObj.broadcasters.delete(user_id);
            devLogger('hapus:',is_removed);

            const broadcasters = mediasoupObj.getBroadcasters();
            // console.log('cok',Array.from(mediasoupObj.broadcasters),typeof socket.decoded_token.sub);
            socket.broadcast.emit('mediasoup_broadcasters',broadcasters);
        });
        
       
    });
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
