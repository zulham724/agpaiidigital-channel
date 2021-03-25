const devLogger = require("../../../lib/devLogger");
module.exports = async function(socket, { mediasoupObj }){
    socket.on("getRouterRtpCapabilities", (data, callback) => {
        // devLogger("[getRouterRtpCapabilities] ");
        // io.emit(mediasoupObj.router.rtpCapabilities);
        devLogger('[getRouterRtpCapabilities]',mediasoupObj.router.rtpCapabilities);
        callback(mediasoupObj.router.rtpCapabilities);


    });
    socket.on('createProducerTransport', async (data, callback) => {
        // console.log("[c] ");
        try {
            const { transport, params } = await mediasoupObj.createWebRtcTransport();
            const broadcaster = {
                user:data.user,
                producerTransport: transport,
                producer: undefined

            }
            devLogger('[+] ProducerTransport ID:',transport.id);

            // mediasoupObj.producerTransport = transport;
            mediasoupObj.broadcasters.set(data.user.id,broadcaster)
            // mediasoupObj.producerTransports.set(transport.id, transport);
            // devLogger('mediasoupObj.producerTransport.id = ',transport.id);
            callback(params);
        } catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });
    socket.on('createConsumerTransport', async (data, callback) => {
        devLogger("[createConsumerTransport] ");
        try {
            const { transport, params } = await mediasoupObj.createWebRtcTransport();
            devLogger('[params consumer]',params);

            mediasoupObj.consumerTransport = transport;
            callback(params);
        } catch (err) {
            console.error(err);
            callback({ error: err.message });
        }
    });
    socket.on('connectProducerTransport', async (data, callback) => {
        devLogger("[connectProducerTransport] ");
        try{
            const broadcaster = mediasoupObj.broadcasters.get(data.user.id);
            devLogger('broadcaster: ',broadcaster);
            const producerTransport = broadcaster.producerTransport;
            await producerTransport.connect({ dtlsParameters: data.dtlsParameters });
            callback();
        }catch(err){
            console.error(err);
            callback({ error: err.message });
        }
    });

    socket.on('connectConsumerTransport', async (data, callback) => {
        devLogger("[connectConsumerTransport] ");
        await mediasoupObj.consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
        callback();
    });

    socket.on('produce', async (data, callback) => {
        devLogger("[produce] ");
        try{
            const broadcaster = mediasoupObj.broadcasters.get(data.user.id);
            const { kind, rtpParameters } = data;
            const producerTransport = broadcaster.producerTransport;
            const producer = await producerTransport.produce({ kind, rtpParameters });
            broadcaster.producer = producer;
            devLogger("producer = ",broadcaster.producer);
        
            callback({ id: producer.id});
            const broadcasters = mediasoupObj.getBroadcasters();
            socket.broadcast.emit('mediasoup_broadcasters',broadcasters);
            // socket.broadcast.emit('newProducer');
        }catch(err){
            console.log('error produce',err);
            callback({error:err.message})
        }
       

        // inform clients about new producer
        
    });

    socket.on('consume', async (data, callback) => {
        // console.log("[consume] ");
        devLogger("[consume] ",mediasoupObj.producer);
        callback(await mediasoupObj.createConsumer(mediasoupObj.producer, data.rtpCapabilities));
    });

    socket.on('resume', async (data, callback) => {
        devLogger("[resume] ");
        await mediasoupObj.consumer.resume();
        callback();
    });

    socket.on('getBroadcasters', async (data, callback)=>{
        let users = [];
        for(let [key, value] of mediasoupObj.broadcasters){
            users.push(value.user);
        }
        callback(users);
    })
}