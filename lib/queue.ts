import { connect, Connection, Channel } from 'amqplib';
import { Subscription } from 'rxjs';
import { When } from 'when';

import { createLogger, Logger } from './logging';

interface MessageContent {
  type: string;
  encoding: string;
  buffer: Buffer;
}

class JsonContent implements MessageContent {
  public type = 'application/json';

  private constructor(public buffer: Buffer, public encoding = 'utf8') {
  }

  public static create<TData>(data: TData, encoding: string = 'utf8'): JsonContent {
    let content = JSON.stringify(data);
    return new JsonContent(
      new Buffer(content, encoding),
      encoding
    );
  }
}

export interface Sink<TData> {
  publish(data: TData, correlationId?: string): boolean;
  close(): Promise<void>;
}

export interface QueueSettings {
  queueUrl: string;
  queueExchange: string;
  queueAppId: string;
  queueMessageType: string;
  queueRoutingPrefix: string;
}

export type ConnectionFactory = (url: string) =>
  Promise<Connection>;

async function defaultConnectionFactory(url: string) {
  return await connect(url);
}

export class RabbitMqExchangeSink<TData> implements Sink<TData> {
  private constructor(
    private _connection: Connection,
    private _channel: Channel,
    private _exchangeName: string,
    private _routingKey: string,
    private _appId: string,
    private _messageType: string,
    private _logger: Logger
  ) { }

  public async close() {
    this._logger.info('Closing channel');
    await this._channel.close();

    this._logger.info('Closing connection');
    await this._connection.close();
  }

  public publish(data: TData, correlationId?: string): boolean {
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

  public static async create<TData>(
    settings: QueueSettings,
    routingName: string,
    connectionFactory: ConnectionFactory = defaultConnectionFactory
  ): Promise<Sink<TData>> {
    const { queueUrl, queueExchange, queueAppId, queueMessageType, queueRoutingPrefix } = settings;
    const logger = createLogger('lib', 'queue', `exchange:${queueExchange}`);

    const connection = await connectionFactory(queueUrl);
    logger.info('Connected to queue', { queueUrl })

    const channel = await connection.createChannel();
    logger.info('Channel created', { queueUrl });

    await channel.checkExchange(queueExchange);
    logger.info('Ready to recieve', { queueUrl, queueExchange });

    const routingKey = [
      queueRoutingPrefix,
      routingName
    ].join('.');

    return new RabbitMqExchangeSink(
      connection,
      channel,
      queueExchange,
      routingKey,
      queueAppId,
      queueMessageType,
      logger
    );
  }
}

export default RabbitMqExchangeSink