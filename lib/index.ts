import { connect } from 'amqplib';
import { Subscription } from 'rxjs';

import argv from './options';
import createInput from './twitter';
import createLogger from './logging';
import Sink from './queue';

let inputSub: Subscription;

const logger = createLogger('lib', 'index');

async function main() {
  const input = createInput(argv);
  const queue = await Sink.create(argv, argv.screenName);
  
  input.do(tweet => {
    queue
  })

  return await input.do(tweet => {
    queue.publish(tweet, tweet.id.toString());
  })
  .toArray()
  .toPromise()
  .then(tweets => {
    logger.info(`Successfully fetched ${tweets.length} tweets`)
    return true;
  }).catch(err => {
    logger.error(`An error occured: ${err.message}`, err);
    return false;
  }).then(async success => {
    await queue.close();
    return success;
  })
}

main().then(success => {
  process.exit(success ? 0 : -1);
});