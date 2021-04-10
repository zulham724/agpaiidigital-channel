const mediasoup = require("mediasoup");
const devLogger = require("../lib/devLogger");
const socket = require("../socket");
const config = require('./../config');

let obj = {
  // variable
  worker: undefined,
  router: undefined,
  producerTransport: undefined,
  producerTransports: new Map(),
  consumerTransport: undefined,
  producer: undefined,
  producers: new Map(),
  consumer: undefined,
  broadcasters: new Map(),
  /*
  struktur untuk broadcaster:
    {
      title,asd
      user: {
        id,
        name,
        email,
        avatar
      }
      producerTransport,
      videoProducer: undefined,
      audioProducer: undefined,
      consumerTransports: new Map(),
      videoConsumers: new Map(),
      audioConsumers: new Map(),
      userConsumers: new Map().
      total_viewer
     
    }
  */
  // methods
  async runMediasoupWorker() {
    console.log("[*] runMediasoupWorker")
    obj.worker = await mediasoup.createWorker({
      logLevel: 'debug',
    });

    obj.worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    // const mediaCodecs = config.mediasoup.router.mediaCodecs;
    const mediaCodecs = config.mediasoup.router.mediaCodecs;

    obj.router = await obj.worker.createRouter({ mediaCodecs });
  },
  async createWebRtcTransport() {
    const {
      maxIncomingBitrate,
      initialAvailableOutgoingBitrate
    } = config.mediasoup.webRtcTransport;

    const transport = await obj.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {
      }
    }
    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      },
    };
  },

  async createConsumer({producer, rtpCapabilities, consumer_user_id, broadcaster_user_id, ...args}) {
    if (!producer) {
      console.error('producer undefined');
      return;
    }
    if (obj.router.canConsume(
      {
        producerId: producer.id,
        rtpCapabilities,
      })
    ) {
      try {
        const broadcaster = obj.broadcasters.get(broadcaster_user_id);
        // jika broadcaster ada, maka get consumerTransport 
        if (broadcaster) {
          const consumerTransport = broadcaster.consumerTransports.get(consumer_user_id);
          if (consumerTransport) {
            const consumer = await consumerTransport.consume({
              producerId: producer.id,
              rtpCapabilities,
              paused: producer.kind === 'video',
            });
           

            // masukkan consumer ke map() sesuai type audio/video
            if (consumer.kind == 'audio') {

              broadcaster.audioConsumers.set(consumer_user_id, consumer);

              // Set Consumer events.
              consumer.on('transportclose', () => {
                // Remove from its map.
                devLogger('transportclose');
                // broadcaster.audioConsumers.delete(consumer_user_id);
              });
              consumer.on('producerclose', () => {
                // Remove from its map.
                devLogger('producerclose');
                // broadcaster.audioConsumers.delete(consumer_user_id);
              });

            } else if (consumer.kind == 'video') {

              broadcaster.videoConsumers.set(consumer_user_id, consumer);

              // Set Consumer events.
              consumer.on('transportclose', () => {
                // Remove from its map.
                devLogger('transportclose');
                // broadcaster.videoConsumers.delete(consumer_user_id);
              });
              consumer.on('producerclose', () => {
                // Remove from its map.
                devLogger('producerclose');
                // broadcaster.videoConsumers.delete(consumer_user_id);
              });

            }
            /////-------------------------------//////
            devLogger("createConsumer", consumer);


            if (consumer.type === 'simulcast') {
              await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
            }

            return {
              broadcaster_user: broadcaster.user,
              broadcaster_title: broadcaster.title,
              producerId: producer.id,
              id: consumer.id,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              type: consumer.type,
              producerPaused: consumer.producerPaused
            };

          } else {
            devLogger('consumeTransport with user_id', consumer_user_id, 'not found');
          }
        } else {
          devLogger('Broadcaster not found');
        }



      } catch (error) {
        console.error('consume failed', error);
        return;
      }


    } else {
      console.error("can't consume");
      return;
    }

  },
  getBroadcasters() {
    let users = [];
    for (let [key, value] of obj.broadcasters) {
      users.push({ ...value.user, title: value.title });
    }
    return users;
  },
  // Akan meng-close audioProducer, videoProducer, dan producerTransport
  // setelah di-close, dihapus dri Map() broadcasters
  closeProducer({ broadcaster_user_id }) {
    try {
      const broadcaster = obj.broadcasters.get(broadcaster_user_id);

      devLogger('[closeProducer] audioProducer to removed:', broadcaster.audioProducer.id);
      devLogger('[closeProducer] videoProducer to removed:', broadcaster.videoProducer.id);
      devLogger('[closeProducer] producerTransport to removed:', broadcaster.producerTransport.id);

      broadcaster.videoProducer.close();
      broadcaster.audioProducer.close();
      broadcaster.producerTransport.close();

      for (const transport of broadcaster.consumerTransports.values()) {
        transport.close();
      }
      for (const consumer of broadcaster.audioConsumers.values()) {
        consumer.close();
      }
      for (const consumer of broadcaster.videoConsumers.values()) {
        consumer.close();
      }

      // remove from its Map
      obj.broadcasters.delete(broadcaster_user_id);
    } catch (e) {
      devLogger(e);
    }

  },
  // Akan meng-close audioConsumer, videoConsumer, dan consumerTranport
  // setelah di-close, dihapus dri Map()
  closeConsumer({ broadcaster_user_id, consumer_user_id }) {
    try {
      const broadcaster = obj.broadcasters.get(broadcaster_user_id);
      if(!broadcaster)throw 'Broadcaster with id '+broadcaster_user_id+' not found';
      const consumerTransport = broadcaster.consumerTransports.get(consumer_user_id);

      const audioConsumer = broadcaster.audioConsumers.get(consumer_user_id);
      const videoConsumer = broadcaster.videoConsumers.get(consumer_user_id);

      devLogger('[closeConsumer] consumerTranport to removed:', consumerTransport.id);
      devLogger('[closeConsumer] audioConsumer to removed:', audioConsumer.id);
      devLogger('[closeConsumer] videoConsumer to removed:', videoConsumer.id);
      consumerTransport.close();
      audioConsumer.close();
      videoConsumer.close();

      // hapus consumer dan tranport dri Map
      broadcaster.audioConsumers.delete(consumer_user_id);
      broadcaster.videoConsumers.delete(consumer_user_id);
      broadcaster.consumerTransports.delete(consumer_user_id);
      broadcaster.userConsumers.delete(consumer_user_id);
      
     

    } catch (e) {
      devLogger(e);
    }
  },
  // melakukan iterasi pada semua broadcasters,
  // jika ada audio/video consumer, transport, userconsumer, maka close dan hapus dri Map()
  closeConsumerInAllBroadcasters(consumer_user_id) {
    try{
      for (let [key, broadcaster] of obj.broadcasters) {
        const check = broadcaster.consumerTransports.has(consumer_user_id);
        if (check) {
          // close dan hapus consumerTransport
          const consumerTransport = broadcaster.consumerTransports.get(consumer_user_id);
          if(consumerTransport){
            consumerTransport.close();
            broadcaster.consumerTransports.delete(consumer_user_id);
          }
  
          // close dan hapus audioConsumer
          const audioConsumer = broadcaster.audioConsumers.get(consumer_user_id);
          if(audioConsumer){
            audioConsumer.close();
            broadcaster.audioConsumers.delete(consumer_user_id);
          }
  
          // close dan hapus videoConsumer
          const videoConsumer = broadcaster.videoConsumers.get(consumer_user_id);
          if(videoConsumer){
            videoConsumer.close();
            broadcaster.videoConsumers.delete(consumer_user_id);
          }
  
          // close dan hapus userConsumer
          const userConsumer = broadcaster.userConsumers.get(consumer_user_id);
          if(userConsumer){
            broadcaster.userConsumers.delete(consumer_user_id);
          }
          
        }
      }
    }catch(err){
      devLogger('closeConsumerInAllBroadcasters',err);
    }
   
  }

}
module.exports = obj;