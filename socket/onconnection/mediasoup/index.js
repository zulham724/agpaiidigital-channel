const devLogger = require("../../../lib/devLogger");
module.exports = async function(socket, { mediasoupObj }){
    socket.on("getRouterRtpCapabilities", (data, callback) => {
        devLogger("[getRouterRtpCapabilities] ");
        // io.emit(mediasoupObj.router.rtpCapabilities);
        callback(mediasoupObj.router.rtpCapabilities);


    });
    socket.on('createProducerTransport', async (data, callback) => {
        console.log("[createProducerTransport] ");
        try {
            const { transport, params } = await mediasoupObj.createWebRtcTransport();
            devLogger('[params producer]',params);

            mediasoupObj.producerTransport = transport;
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
        await mediasoupObj.producerTransport.connect({ dtlsParameters: data.dtlsParameters });
        callback();
    });

    socket.on('connectConsumerTransport', async (data, callback) => {
        devLogger("[connectConsumerTransport] ");
        await mediasoupObj.consumerTransport.connect({ dtlsParameters: data.dtlsParameters });
        callback();
    });

    socket.on('produce', async (data, callback) => {
        devLogger("[produce] ");
        const { kind, rtpParameters } = data;
        mediasoupObj.producer = await mediasoupObj.producerTransport.produce({ kind, rtpParameters });
        callback({ id: mediasoupObj.producer.id });

        // inform clients about new producer
        socket.broadcast.emit('newProducer');
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
}