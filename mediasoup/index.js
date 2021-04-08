const mediasoup = require("mediasoup");
const devLogger = require("../lib/devLogger");
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
      consumerTransports: [undefasdasdasdined],
      videoProducer: undefined,
      audioProducer: undefined,
      consumers:  [

      ]
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

  async createConsumer(producer, rtpCapabilities, consumer_user_id, broadcaster_user_id) {
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
  closeConsumer({ broadcaster_user_id, consumer_user_id }) {
    try {
      const broadcaster = obj.broadcasters.get(broadcaster_user_id);
      const consumerTransport = broadcaster.consumerTransports.get(consumer_user_id);

      const audioConsumer = broadcaster.audioConsumers.get(consumer_user_id);
      const videoConsumer = broadcaster.videoConsumers.get(consumer_user_id);

      devLogger('[closeConsumer] consumerTranport to removed:', consumerTransport.id);
      devLogger('[closeConsumer] audioConsumer to removed:', audioConsumer.id);
      devLogger('[closeConsumer] videoConsumer to removed:', videoConsumer.id);
      consumerTransport.close();
      audioConsumer.close();
      videoConsumer.close();
    } catch (e) {
      devLogger(e);
    }
  }

}
module.exports = obj;