// const { parse } = require("mediasoup/lib/scalabilityModes");
const devLogger = require("../../../lib/devLogger");
const { broadcasters } = require("../../../mediasoup");
// const { broadcasters } = require("../../../mediasoup");
module.exports = async function (socket, io, { mediasoupObj }) {
    socket.on("getRouterRtpCapabilities", (data, callback) => {
        // devLogger("[getRouterRtpCapabilities] ");
        // io.emit(mediasoupObj.router.rtpCapabilities);
        devLogger('[getRouterRtpCapabilities]', mediasoupObj.router.rtpCapabilities);
        callback(mediasoupObj.router.rtpCapabilities);


    });
    socket.on('createProducerTransport', async (data, callback) => {
        // console.log("[c] ");pipeToRouter
        try {
            // membuat room socket.io untuk menampung producer dan consumers
            const room = 'broadcaster_user_id:' + data.user.id;
            socket.join(room);

            const { transport, params } = await mediasoupObj.createWebRtcTransport();
            transport.observer.on("close", () => {
                // socket di sini mengacu pada producer
                // memberi signal ke semua client dalam 1 room yg sama kecuali producer, bahwa transport telah di-close/siaran langsung berhenti
                socket.to(room).emit('producerTransportIsClosed');
                // fungsinya sama, cman berbeda nama event saja, digunakan untuk app versi lama
                socket.to(room).emit('transportClose');
            });

            const broadcaster = {
                title: data.title,
                user: data.user,
                // transports: transport,
                producerTransport: transport,
                consumerTransports: new Map(),
                // producer: undefined,
                videoProducer: undefined,
                audioProducer: undefined,
                // consumers: new Map(),
                audioConsumers: new Map(),
                videoConsumers: new Map(),
                userConsumers: new Map(),
                chats: [],
                total_viewer: 0,


            }
            devLogger('[+] ProducerTransport ID:', transport.id);

            // mediasoupObj.producerTransport = transport;
            mediasoupObj.broadcasters.set(data.user.id, broadcaster)
            // mediasoupObj.producerTransports.set(transport.id, transport);
            // devLogger('mediasoupObj.producerTransport.id = ',transport.id);
            callback(params);
        } catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });
    socket.on('createConsumerTransport', async (data, callback) => {
        devLogger("[createConsumerTransport] ", data);
        try {

            const broadcaster_user_id = parseInt(data.broadcaster_user_id);

            // membuat room socket.io untuk menampung producer dan consumers
            const room = 'broadcaster_user_id:' + broadcaster_user_id;
            socket.join(room);

            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            if (broadcaster) {
                const { transport, params } = await mediasoupObj.createWebRtcTransport();


                devLogger('[params consumer]', params);

                const my_user_id = parseInt(socket.decoded_token.sub);
                // jika consumer transport ada, maka hapus dan buat baru
                if (broadcaster.consumerTransports.has(my_user_id)) {

                    // beritahu socket saat ini bahwa consumerTransport'nya ditimpa dengan yg baru
                    // io.to(socket.id).emit('myConsumerTransportIsClosed');

                    const myConsumerTransport = broadcaster.consumerTransports.get(my_user_id);
                    myConsumerTransport.close();
                    // kemudian hapus dari map
                    if (broadcaster.consumerTransports.delete(my_user_id)) {
                        devLogger('Sukses hapus consumerTranport dengan id:', my_user_id);
                    }

                }

                // jika videoConsumer ada, maka hapus dan buat baru
                if (broadcaster.videoConsumers.has(my_user_id)) {
                    const videoConsumer = broadcaster.videoConsumers.get(my_user_id);
                    videoConsumer.close();
                    // kemudian hapus dari map
                    if (broadcaster.videoConsumers.delete(my_user_id)) {
                        devLogger('Sukses hapus videoConsumer dengan id:', my_user_id);
                    }

                }

                // jika audioConsumer ada, maka hapus dan buat baru
                if (broadcaster.audioConsumers.has(my_user_id)) {
                    const audioConsumer = broadcaster.audioConsumers.get(my_user_id);
                    audioConsumer.close();
                    // kemudian hapus dari map
                    if (broadcaster.audioConsumers.delete(my_user_id)) {
                        devLogger('Sukses hapus audioConsumer dengan id:', my_user_id);
                    }

                }

                // const myConsumerTransport = mediasoupObj.consumerTransports.set(my_user_id, transport);
                broadcaster.consumerTransports.set(my_user_id, transport);

                //masukkan data user ke map userConsumers dan emit ke semua client socket.io
                if (data.user_consumer) {
                    broadcaster.userConsumers.set(my_user_id, data.user_consumer);
                    devLogger('user_consumer:', data.user_consumer);

                    // memberi sinyal jumlah viewers pada semua client dalam 1 room
                    io.to(room).emit('total_broadcaster_viewer', { broadcaster_user_id, total_viewer: broadcaster.userConsumers.size });
                }


                // mediasoupObj.consumerTransports = transport;
                callback(params);
            } else {
                callback({ code: 404, error: 'Broadcaster dengan user id ' + broadcaster_user_id + ' tidak ditemukan' });
            }

        } catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });
    socket.on('connectProducerTransport', async (data, callback) => {
        devLogger("[connectProducerTransport] ");
        try {
            const broadcaster = mediasoupObj.broadcasters.get(data.user.id);
            devLogger('broadcaster: ', broadcaster);
            const producerTransport = broadcaster.producerTransport;
            await producerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        } catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });

    socket.on('connectConsumerTransport', async (data, callback) => {
        devLogger("[connectConsumerTransport] ", data);
        try {
            const my_user_id = parseInt(socket.decoded_token.sub);
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            const consumerTransport = broadcaster.consumerTransports.get(my_user_id);

            // await consumerTransport.connect({ broadcaster_user_id, dtlsParameters: data.dtlsParameters });
            await consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
            devLogger("consumerTransport.iceState", consumerTransport.iceState);
            callback();
        } catch (e) {
            console.error(e);
            callback({ error: e.message })
        }

    });

    socket.on('produce', async (data, callback) => {
        devLogger("[produce] ");
        try {
            const broadcaster = mediasoupObj.broadcasters.get(data.user.id);
            const { kind, rtpParameters } = data;
            const producerTransport = broadcaster.producerTransport;

            let producer;
            if (kind == 'video') {
                producer = await producerTransport.produce({ kind, rtpParameters });
                broadcaster.videoProducer = producer;
                devLogger("videoProducer = ", broadcaster.videoProducer);
            } else if (kind == 'audio') {
                producer = await producerTransport.produce({ kind, rtpParameters });
                broadcaster.audioProducer = producer;
                devLogger("audioProducer = ", broadcaster.audioProducer);
            } else {
                // devLogger("kind not specified");
            }


            const broadcasters = mediasoupObj.getBroadcasters();
            socket.broadcast.emit('mediasoup_broadcasters', broadcasters);
            callback({ id: producer.id });

            // socket.broadcast.emit('newProducer');
        } catch (err) {
            console.log('error produce', err);
            callback({ error: err.message })
        }


        // inform clients about new producer

    });

    socket.on('consume', async (data, callback) => {
        // console.log("[consume] ");
        try {
            const kind = data.kind;
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);

            if (mediasoupObj.broadcasters.has(broadcaster_user_id)) {
                const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
                devLogger("[consume] consume videoProducer", broadcaster.videoProducer);
                // devLogger("[consume] consume audeoProducer", broadcaster.audeoProducer);
                let producer;
                if (kind == 'audio') {
                    producer = broadcaster.audioProducer;
                } else if (kind == 'video') {
                    producer = broadcaster.videoProducer;
                }

                const params = { producer, rtpCapabilities: data.rtpCapabilities, consumer_user_id: parseInt(socket.decoded_token.sub), broadcaster_user_id };
                callback(await mediasoupObj.createConsumer(params));
            } else {
                callback({ error: 'Broadcaster with user id: ' + broadcaster_user_id + ' not found' })
            }
        } catch (e) {
            console.error(e);
            callback({ error: e.message });
        }

    });

    socket.on('resume', async (data, callback) => {
        try {
            devLogger("[resume] ", data);
            const consumer_user_id = parseInt(socket.decoded_token.sub);
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            const videoConsumer = broadcaster.videoConsumers.get(consumer_user_id);
            await videoConsumer.resume();
            // d
            // await mediasoupObj.consumer.resume();
            callback();
        } catch (e) {
            devLogger(e);
            callback({ error: e.message });
        }

    });

    // mendapatkan list orang yang melakukan siaran langsung
    socket.on('getBroadcasters', async (data, callback) => {
        // const my_user_id = parseInt(socket.decoded_token.sub);
        const broadcasters = mediasoupObj.getBroadcasters();
        callback(broadcasters);
    });
    // mendapatkan jumlah penonton berdasarkan broadcaster yang ditentukan
    socket.on('getViewers', async ({ broadcaster_user_id }, callback) => {
        try {
            const broadcaster = mediasoupObj.broadcasters.get(parseInt(broadcaster_user_id));
            if (broadcaster) {
                const viewers = Array.from(broadcaster.userConsumers.values());
                callback({ users: viewers });
            } else callback({ error: 'Broadcaster not found' });

        } catch (err) {
            callback({ error: err.message })
        }
    });

    socket.on('closeProducer', async (data, callback) => {
        try {
            const broadcaster_user_id = parseInt(socket.decoded_token.sub);
            mediasoupObj.closeProducer({ broadcaster_user_id });

            // notify broadcasters
            socket.broadcast.emit('mediasoup_broadcasters', mediasoupObj.getBroadcasters());

            callback({ success: true });
        } catch (e) {
            callback({ error: e.message });
        }

    });

    socket.on('closeConsumer', async (data, callback) => {
        try {
            devLogger(['[closeConsumer] ', data]);

            const consumer_user_id = parseInt(socket.decoded_token.sub);
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const room = 'broadcaster_user_id:' + broadcaster_user_id;

            mediasoupObj.closeConsumer({ broadcaster_user_id, consumer_user_id })

            // lakukan pengecekan
            if (mediasoupObj.broadcasters.has(broadcaster_user_id)) {
                const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
                // jika ada atribut userConsumers, maka lakukan proses ini
                if (broadcaster.userConsumers) {
                    // memberi sinyal jumlah viewers pada semua client dalam 1 room
                    io.to(room).emit('total_broadcaster_viewer', { broadcaster_user_id, total_viewer: broadcaster.userConsumers.size });
                    // socket.broadcast.emit('total_broadcaster_viewer', { broadcaster_user_id, total_viewer: broadcaster.userConsumers.size });
                }
            }
            // remove broadcaster from its Map
            callback({ success: true });
        } catch (e) {
            callback({ error: e.message });
        }

    });

    socket.on('live_streaming_chat', async (data) => {
        try {
            // struktur untuk chat:
            // {
            //  message,
            //  user:{
            //     email,name,avatar
            //   }
            // }
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            if (broadcaster) {
                const room = 'broadcaster_user_id:' + broadcaster_user_id;
                socket.to(room).emit('live_streaming_chat', data);
                broadcaster.chats.push({
                    user: data.user,
                    message: data.message
                });
                devLogger("[live_streaming_chat] data:", data);


            } else {
                devLogger('[live_streaming_chat] broadcaster not found:', data);
            }
        } catch (err) {
            devLogger('Error in [live_streaming_chat]', err);
        }
    });

    socket.on('getBroadcasterChats', async ({ broadcaster_user_id }, callback) => {
        try {
            const broadcaster = mediasoupObj.broadcasters.get(parseInt(broadcaster_user_id));
            if (broadcaster) {
                const chats = broadcaster.chats;
                callback({ chats });
            } else callback({ error: 'Broadcaster not found' });
        } catch (err) {
            callback({ error: err.message })
        }
    });
}