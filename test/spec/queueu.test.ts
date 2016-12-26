import { Mock, IMock, It, Times } from 'typemoq';
import { expect } from 'chai';


import * as amqplib from 'amqplib';

import { QueueSettings, Sink, RabbitMqExchangeSink, ConnectionFactory } from '../../lib/queue';

import './setupTests';

const SETTINGS: QueueSettings = {
  queueUrl: 'TEST_QUEUE_URL',
  queueAppId: 'unittests',
  queueExchange: 'test-exchange',
  queueMessageType: 'test-message-type',
  queueRoutingPrefix: 'test-prefix'
};

const ROUTING_NAME: string = 'test-routing';

interface AmqpLib {
  connect: ConnectionFactory;
}

describe('spec: lib/queue', () => {
  let connectionFactoryMock: IMock<ConnectionFactory>;
  let connectionMock: IMock<amqplib.Connection>; 
  let channelMock: IMock<amqplib.Channel>;

  let sink: Sink<any>;

  async function createSink () {
    return await RabbitMqExchangeSink.create(SETTINGS, ROUTING_NAME, connectionFactoryMock.object);
  }

  beforeEach(async () => {
    connectionFactoryMock = Mock.ofInstance<ConnectionFactory>((url: string) => null);
    connectionMock = Mock.ofInstance<amqplib.Connection>(<any>{
      createChannel: () => {},
      close: () => {}
    });
    channelMock = Mock.ofInstance<amqplib.Channel>(<any>{
      checkExchange: () => {},
      close: () => {},
      publish: () => {}
    });

    connectionFactoryMock.setup(i => i(It.isAnyString()))
      .returns(() => Promise.resolve(connectionMock.object));

    connectionMock.setup(i => i.createChannel())
      .returns(() => <any>Promise.resolve(channelMock.object));

    channelMock.setup(i => i.checkExchange(It.isAnyString()))
      .returns(() => <any>Promise.resolve());
  
    sink = await createSink();
  });

  describe('factory method', () => {
    it('calls connection factory with correct url parameter', async () => {
      connectionFactoryMock.verify(i => i(SETTINGS.queueUrl), Times.once());
    });

    it('creates channel on retrieved connection', async () => {
      connectionMock.verify(i => i.createChannel(), Times.once());
    });

    it('verifies the exchange name', () => {
      channelMock.verify(i => i.checkExchange(SETTINGS.queueExchange), Times.once());
    });

    it('returns a working message sink', () => {
      expect(sink).not.to.be.null;
    });
  });

  describe('instance', () => {
    describe('when closing', async () => {
      beforeEach(async () => {
        await sink.close();
      });
      
      it('closes channel', () => {
        channelMock.verify(i => i.close(), Times.once());
      });

      it('closes connection', () => {
        connectionMock.verify(i => i.close(), Times.once());
      });
    });

    describe('when publishing message', () => {
      const EXPECTED_MESSAGE = {
        id: 'test',
        type: 'test'
      };

      const EXPECTED_CORRELATION_ID = "test: ahoy!";

      beforeEach(() => {
        sink.publish(EXPECTED_MESSAGE, EXPECTED_CORRELATION_ID);
      });
    
      describe('calls publish method on channel with', () => {
        it('correct exchange name', () => {
          channelMock.verify(i => i.publish(
            SETTINGS.queueExchange,
            It.isAnyString(),
            It.isAny(),
            It.isAny()
          ), Times.once());
        });

        it('correct routing key', () => {
          const expectedRoutingKey = [SETTINGS.queueRoutingPrefix, ROUTING_NAME].join('.');
          channelMock.verify(i => i.publish(
            It.isAny(),
            expectedRoutingKey,
            It.isAny(),
            It.isAny()
          ), Times.once());
        });

        it('content buffer containing object serialized to JSON string', () => {
          const expectedRoutingKey = [SETTINGS.queueRoutingPrefix, ROUTING_NAME].join('.');
          channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.is<Buffer>(b => {
              expect(b.toString()).to.be.equal(JSON.stringify(EXPECTED_MESSAGE));
              return true;
            }),
            It.isAny()
          ), Times.once());
        });

        describe('message options that', () => {
          it('has contentType set to \'application/json\'', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
              expect(p.contentType).to.be.equal('application/json');
              return true;
            })
          ), Times.once());
          });

          it('has  contentEncoding set to \'utf8\'', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
                expect(p.contentEncoding).to.be.equal('utf8');
                return true;
              })
            ), Times.once());
          });

          it('has appId set to value from settings', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
                expect(p.appId).to.be.equal(SETTINGS.queueAppId);
                return true;
              })
            ), Times.once());
          });
          
          it('has timestamp defined', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
                expect(p.timestamp).to.be.greaterThan(0);
                return true;
              })
            ), Times.once());
          });

          it('has messageType set to value from settings', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
                expect(p.type).to.be.equal(SETTINGS.queueMessageType);
                return true;
              })
            ), Times.once());
          });

          it('has correlationId set to value passed, when publishing', () => {
            channelMock.verify(i => i.publish(
            It.isAny(),
            It.isAny(),
            It.isAny(),
            It.is<amqplib.Options.Publish>(p => {
                expect(p.correlationId).to.be.equal(EXPECTED_CORRELATION_ID);
                return true;
              })
            ), Times.once());
          });
        });
      });
    });
  });
});