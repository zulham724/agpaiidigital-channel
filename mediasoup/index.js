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
            if(consumer.kind=='audio'){
              broadcaster.audioConsumers.set(consumer_user_id, consumer);
            }else if(consumer.kind=='video'){
              broadcaster.videoConsumers.set(consumer_user_id, consumer);
            }
            /////-------------------------------//////
            devLogger("createConsumer", consumer);
            if (consumer.type === 'simulcast') {
              await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
            }

            return {
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
      users.push(value.user);
    }
    return users;
  }

}
module.exports = obj;