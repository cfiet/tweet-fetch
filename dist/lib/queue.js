"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const amqplib_1 = require("amqplib");
const logging_1 = require("./logging");
class JsonContent {
    constructor(buffer, encoding = 'utf8') {
        this.buffer = buffer;
        this.encoding = encoding;
        this.type = 'application/json';
    }
    static create(data, encoding = 'utf8') {
        let content = JSON.stringify(data);
        return new JsonContent(new Buffer(content, encoding), encoding);
    }
}
function defaultConnectionFactory(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield amqplib_1.connect(url);
    });
}
class RabbitMqExchangeSink {
    constructor(_connection, _channel, _exchangeName, _routingKey, _appId, _messageType, _logger) {
        this._connection = _connection;
        this._channel = _channel;
        this._exchangeName = _exchangeName;
        this._routingKey = _routingKey;
        this._appId = _appId;
        this._messageType = _messageType;
        this._logger = _logger;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.info('Closing channel');
            yield this._channel.close();
            this._logger.info('Closing connection');
            yield this._connection.close();
        });
    }
    publish(data, correlationId) {
        let content = JsonContent.create(data);
        this._logger.info('Publishing data', {
            routingKey: this._routingKey,
            messageType: this._messageType,
            appId: this._appId,
            size: content.buffer.length,
            correlationId
        });
        return this._channel.publish(this._exchangeName, this._routingKey, content.buffer, {
            contentType: content.type,
            contentEncoding: content.encoding,
            appId: this._appId,
            correlationId: correlationId,
            timestamp: Date.now(),
            type: this._messageType
        });
    }
    static create(settings, routingName, connectionFactory = defaultConnectionFactory) {
        return __awaiter(this, void 0, void 0, function* () {
            const { queueUrl, queueExchange, queueAppId, queueMessageType, queueRoutingPrefix } = settings;
            const logger = logging_1.createLogger('lib', 'queue', `exchange:${queueExchange}`);
            const connection = yield connectionFactory(queueUrl);
            logger.info('Connected to queue', { queueUrl });
            const channel = yield connection.createChannel();
            logger.info('Channel created', { queueUrl });
            yield channel.checkExchange(queueExchange);
            logger.info('Ready to recieve', { queueUrl, queueExchange });
            const routingKey = [
                queueRoutingPrefix,
                routingName
            ].join('.');
            return new RabbitMqExchangeSink(connection, channel, queueExchange, routingKey, queueAppId, queueMessageType, logger);
        });
    }
}
exports.RabbitMqExchangeSink = RabbitMqExchangeSink;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RabbitMqExchangeSink;
//# sourceMappingURL=queue.js.map