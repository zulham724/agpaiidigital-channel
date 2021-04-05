const { parse } = require("mediasoup/lib/scalabilityModes");
const devLogger = require("../../../lib/devLogger");
const { broadcasters } = require("../../../mediasoup");
module.exports = async function(socket, { mediasoupObj }){
    socket.on("getRouterRtpCapabilities", (data, callback) => {
        // devLogger("[getRouterRtpCapabilities] ");
        // io.emit(mediasoupObj.router.rtpCapabilities);
        devLogger('[getRouterRtpCapabilities]',mediasoupObj.router.rtpCapabilities);
        callback(mediasoupObj.router.rtpCapabilities);


    });
    socket.on('createProducerTransport', async (data, callback) => {
        // console.log("[c] ");pipeToRouter
        try {
            const { transport, params } = await mediasoupObj.createWebRtcTransport();
            const broadcaster = {
                title:data.title,
                user:data.user,
                // transports: transport,
                producerTransport:transport,
                consumerTransports:new Map(),
                producer: undefined,
                videoProducer: undefined,
                audioProducer: undefined,
                consumers: new Map(),
                audioConsumers: new Map(),
                videoConsumers: new Map(),

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
        devLogger("[createConsumerTransport] ",data);
        try {
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            if(broadcaster){
                const { transport, params } = await mediasoupObj.createWebRtcTransport();
                devLogger('[params consumer]',params);

                const my_user_id = parseInt(socket.decoded_token.sub);
                // jika consumer transport ada, maka hapus dan buat baru
                if(broadcaster.consumerTransports.has(my_user_id)){
                    const myConsumerTransport = broadcaster.consumerTransports.get(my_user_id);
                    myConsumerTransport.close();
                    // kemudian hapus dari map
                    if(broadcaster.consumerTransports.delete(my_user_id)){
                        devLogger('Sukses hapus consumerTranport dengan id:',my_user_id);
                    }

                }

                // jika videoConsumer ada, maka hapus dan buat baru
                if(broadcaster.videoConsumers.has(my_user_id)){
                    const videoConsumer = broadcaster.videoConsumers.get(my_user_id);
                    videoConsumer.close();
                    // kemudian hapus dari map
                    if(broadcaster.videoConsumers.delete(my_user_id)){
                        devLogger('Sukses hapus videoConsumer dengan id:',my_user_id);
                    }

                }

                 // jika audioConsumer ada, maka hapus dan buat baru
                 if(broadcaster.audioConsumers.has(my_user_id)){
                    const audioConsumer = broadcaster.audioConsumers.get(my_user_id);
                    audioConsumer.close();
                    // kemudian hapus dari map
                    if(broadcaster.audioConsumers.delete(my_user_id)){
                        devLogger('Sukses hapus audioConsumer dengan id:',my_user_id);
                    }

                }

                // const myConsumerTransport = mediasoupObj.consumerTransports.set(my_user_id, transport);
                broadcaster.consumerTransports.set(my_user_id, transport);
                
                // mediasoupObj.consumerTransports = transport;
                callback(params);
            }else{
                callback({code:404,error:'Broadcaster dengan user id '+broadcaster_user_id+' tidak ditemukan'});
            }
            
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
        devLogger("[connectConsumerTransport] ",data);
        try{
            const my_user_id = parseInt(socket.decoded_token.sub);
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            const consumerTransport = broadcaster.consumerTransports.get(my_user_id);
            
            await consumerTransport.connect({broadcaster_user_id, dtlsParameters: data.dtlsParameters });
            callback();
        }catch(e){
            console.error(e);
            callback({error:e.message})
        }
       
    });

    socket.on('produce', async (data, callback) => {
        devLogger("[produce] ");
        try{
            const broadcaster = mediasoupObj.broadcasters.get(data.user.id);
            const { kind, rtpParameters } = data;
            const producerTransport = broadcaster.producerTransport;

            let producer;
            if (kind=='video'){
                producer = await producerTransport.produce({ kind, rtpParameters });
                broadcaster.videoProducer = producer;
                devLogger("videoProducer = ",broadcaster.videoProducer);
            }else if(kind=='audio'){
                producer = await producerTransport.produce({ kind, rtpParameters });
                broadcaster.audioProducer = producer;
                devLogger("audioProducer = ",broadcaster.audioProducer);
            }else{
                devLogger("asu");
            }
             
        
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
        try{
            const kind=data.kind;
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);

            if(mediasoupObj.broadcasters.has(broadcaster_user_id)){
                const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
                devLogger("[consume] consume videoProducer", broadcaster.videoProducer);
                // devLogger("[consume] consume audeoProducer", broadcaster.audeoProducer);
                let producer;
                if(kind=='audio'){
                    producer = broadcaster.audioProducer;
                }else if(kind=='video'){
                    producer = broadcaster.videoProducer;
                }
    
                callback(await mediasoupObj.createConsumer(producer, data.rtpCapabilities, parseInt(socket.decoded_token.sub), broadcaster_user_id ));
            }else{
                callback({error:'Broadcaster with user id: '+broadcaster_user_id+' not found'})
            }
        }catch(e){
            console.error(e);
            callback({error:e.message});
        }
        
    });

    socket.on('resume', async (data, callback) => {
        try{
            devLogger("[resume] ",data);
            const consumer_user_id = parseInt(socket.decoded_token.sub);
            const broadcaster_user_id = parseInt(data.broadcaster_user_id);
            const broadcaster = mediasoupObj.broadcasters.get(broadcaster_user_id);
            const videoConsumer = broadcaster.videoConsumers.get(consumer_user_id);
            await videoConsumer.resume();
            // d
            // await mediasoupObj.consumer.resume();
            callback();
        }catch(e){
            devLogger(e);
            callback({error:e.message});
        }
       
    });

    socket.on('getBroadcasters', async (data, callback)=>{
        let users = [];
        for(let [key, value] of mediasoupObj.broadcasters){
            users.push(value.user);
        }
        callback(users);
    })
}