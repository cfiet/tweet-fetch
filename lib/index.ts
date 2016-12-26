import { connect } from 'amqplib';
import { Subscription } from 'rxjs';

import argv from './options';
import input from './twitter';
import createLogger from './logging';

let inputSub: Subscription;

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

const logger = createLogger('lib', 'index');

async function main() {
  let { queueUrl, queueExchange, queueAppId, queueMessageType, queueRoutingPrefix } = argv;
  const connection = await connect(queueUrl);
  logger.info('Connected to queue', { queueUrl })

  const channel = await connection.createChannel();
  logger.info('Channel created', { queueUrl });

  await channel.checkExchange(argv.queueExchange);
  logger.info('Exchange ready to recieve', { queueUrl, queueExchange });

  let routingKey = [
    argv.queueRoutingPrefix,
    argv.screenName
  ].join('.');

  return await input.do(tweet => {
    let content = JsonContent.create(tweet);
    channel.publish(argv.queueExchange, routingKey, content.buffer, {
      contentType: content.type,
      contentEncoding: content.encoding,
      appId: argv.queueAppId,
      correlationId: tweet.id.toString(),
      timestamp: Date.now(),
      type: argv.queueMessageType
    });
  }).toArray().toPromise();
}

main().then(tweets => {
  logger.info(`Successfully fetched ${tweets.length} tweets`)
  return true;
}).catch(err => {
  logger.error(`An error occured: ${err.message}`, err);
  return false;
}).then(success => {
  process.exit(success ? 0 : -1);
});