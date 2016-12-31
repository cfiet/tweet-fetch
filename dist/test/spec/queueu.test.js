"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const typemoq_1 = require("typemoq");
const chai_1 = require("chai");
const queue_1 = require("../../lib/queue");
require("./setupTests");
const SETTINGS = {
    queueUrl: 'TEST_QUEUE_URL',
    queueAppId: 'unittests',
    queueExchange: 'test-exchange',
    queueMessageType: 'test-message-type',
    queueRoutingPrefix: 'test-prefix'
};
const ROUTING_NAME = 'test-routing';
describe('spec: lib/queue', () => {
    let connectionFactoryMock;
    let connectionMock;
    let channelMock;
    let sink;
    function createSink() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield queue_1.RabbitMqExchangeSink.create(SETTINGS, ROUTING_NAME, connectionFactoryMock.object);
        });
    }
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        connectionFactoryMock = typemoq_1.Mock.ofInstance((url) => null);
        connectionMock = typemoq_1.Mock.ofInstance({
            createChannel: () => { },
            close: () => { }
        });
        channelMock = typemoq_1.Mock.ofInstance({
            checkExchange: () => { },
            close: () => { },
            publish: () => { }
        });
        connectionFactoryMock.setup(i => i(typemoq_1.It.isAnyString()))
            .returns(() => Promise.resolve(connectionMock.object));
        connectionMock.setup(i => i.createChannel())
            .returns(() => Promise.resolve(channelMock.object));
        channelMock.setup(i => i.checkExchange(typemoq_1.It.isAnyString()))
            .returns(() => Promise.resolve());
        sink = yield createSink();
    }));
    describe('factory method', () => {
        it('calls connection factory with correct url parameter', () => __awaiter(this, void 0, void 0, function* () {
            connectionFactoryMock.verify(i => i(SETTINGS.queueUrl), typemoq_1.Times.once());
        }));
        it('creates channel on retrieved connection', () => __awaiter(this, void 0, void 0, function* () {
            connectionMock.verify(i => i.createChannel(), typemoq_1.Times.once());
        }));
        it('verifies the exchange name', () => {
            channelMock.verify(i => i.checkExchange(SETTINGS.queueExchange), typemoq_1.Times.once());
        });
        it('returns a working message sink', () => {
            chai_1.expect(sink).not.to.be.null;
        });
    });
    describe('instance', () => {
        describe('when closing', () => __awaiter(this, void 0, void 0, function* () {
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                yield sink.close();
            }));
            it('closes channel', () => {
                channelMock.verify(i => i.close(), typemoq_1.Times.once());
            });
            it('closes connection', () => {
                connectionMock.verify(i => i.close(), typemoq_1.Times.once());
            });
        }));
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
                    channelMock.verify(i => i.publish(SETTINGS.queueExchange, typemoq_1.It.isAnyString(), typemoq_1.It.isAny(), typemoq_1.It.isAny()), typemoq_1.Times.once());
                });
                it('correct routing key', () => {
                    const expectedRoutingKey = [SETTINGS.queueRoutingPrefix, ROUTING_NAME].join('.');
                    channelMock.verify(i => i.publish(typemoq_1.It.isAny(), expectedRoutingKey, typemoq_1.It.isAny(), typemoq_1.It.isAny()), typemoq_1.Times.once());
                });
                it('content buffer containing object serialized to JSON string', () => {
                    const expectedRoutingKey = [SETTINGS.queueRoutingPrefix, ROUTING_NAME].join('.');
                    channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(b => {
                        chai_1.expect(b.toString()).to.be.equal(JSON.stringify(EXPECTED_MESSAGE));
                        return true;
                    }), typemoq_1.It.isAny()), typemoq_1.Times.once());
                });
                describe('message options that', () => {
                    it('has contentType set to \'application/json\'', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.contentType).to.be.equal('application/json');
                            return true;
                        })), typemoq_1.Times.once());
                    });
                    it('has  contentEncoding set to \'utf8\'', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.contentEncoding).to.be.equal('utf8');
                            return true;
                        })), typemoq_1.Times.once());
                    });
                    it('has appId set to value from settings', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.appId).to.be.equal(SETTINGS.queueAppId);
                            return true;
                        })), typemoq_1.Times.once());
                    });
                    it('has timestamp defined', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.timestamp).to.be.greaterThan(0);
                            return true;
                        })), typemoq_1.Times.once());
                    });
                    it('has messageType set to value from settings', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.type).to.be.equal(SETTINGS.queueMessageType);
                            return true;
                        })), typemoq_1.Times.once());
                    });
                    it('has correlationId set to value passed, when publishing', () => {
                        channelMock.verify(i => i.publish(typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.isAny(), typemoq_1.It.is(p => {
                            chai_1.expect(p.correlationId).to.be.equal(EXPECTED_CORRELATION_ID);
                            return true;
                        })), typemoq_1.Times.once());
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=queueu.test.js.map