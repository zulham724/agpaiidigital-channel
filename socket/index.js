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
        mediasoupModule(socket, io, { mediasoupObj: mediasoupObj });

        socket.on("disconnect", () => {
            devLogger('[disconnect] user_id', socket.decoded_token.sub, ' disconnect');

            const user_id = parseInt(socket.decoded_token.sub);

            try {

                // sbg Producer, hapus dri Map broadcasters jika disconnect
                if (mediasoupObj.broadcasters.has(user_id)) {
                    // close producer dan transport, dan hapus broadcaster dri Map
                    // const broadcaster = mediasoupObj.broadcasters.get(user_id);
                    // devLogger('producer id to removed:',broadcaster.audioProducer.id, broadcaster.videoProducer.id)
                    mediasoupObj.closeProducer({ broadcaster_user_id: user_id })


                }

                // sbg Consumer, hapus dri semua proprety dri broadcasters map() 
                let broadcasters_target = mediasoupObj.closeConsumerInAllBroadcasters(user_id);
                // beri sinyal pada semua broadcaster untuk memberitahu jumlah viewer sekarang
                for (let broadcaster of broadcasters_target) {
                    const room = 'broadcaster_user_id:' + broadcaster.user.id;
                    io.to(room).emit('total_broadcaster_viewer', { broadcaster_user_id: broadcaster.user.id, total_viewer: broadcaster.userConsumers.size });
                }
                //


            } catch (e) {
                devLogger('error', e);
            }

            const is_removed = mediasoupObj.broadcasters.delete(user_id);
            devLogger('hapus:', is_removed);

            const broadcasters = mediasoupObj.getBroadcasters();
            // console.log('cok',Array.from(mediasoupObj.broadcasters),typeof socket.decoded_token.sub);
            socket.broadcast.emit('mediasoup_broadcasters', broadcasters);
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
