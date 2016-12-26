import { expect } from 'chai';
import { Observable } from 'rxjs';

import { TwitterClient } from 'twitter/interfaces';
import Twitter = require('twitter');

import { Mock, IMock, It, Times, MockBehavior } from 'typemoq';

import './setup';

import createInput from '../../lib/twitter';

describe('spec: lib/twitter', () => {
  const SETTINGS = {
    screenName: 'test_user',
    fetchBatchSize: 10
  };

  const TWEETS = [
    { id: 10 },
    { id: 9 },
    { id: 8 },
    { id: 7 },
    { id: 6 }
  ];

  let clientMock: IMock<TwitterClient>;

  let input: Observable<any>;
  let result: any[];

  before(async () => {
    clientMock = Mock.ofInstance<TwitterClient>(<any>{
      get: () => {}
    });

    let calls = 0;
    const BATCHES = [
      [ TWEETS[0], TWEETS[1], TWEETS[2] ],
      [ TWEETS[2], TWEETS[3], TWEETS[4] ]
    ];

    clientMock.setup(i => i.get(It.isAnyString(), It.isAny(), It.isAny()))
      .callback((e, p, cb) => {
        if (BATCHES[calls] !== undefined) {
          cb(null, BATCHES[calls++]);
          return;
        }
        cb(null, [TWEETS[4]]);
      })

    input = createInput(SETTINGS, clientMock.object);
    result = await input.toArray().toPromise();  
  });

  describe('calls Twitter API', () => {
    const TWITTER_ENDPOINT = 'statuses/user_timeline'; 
    it(`endpoint '${TWITTER_ENDPOINT}'`, () => {
      clientMock.verify(
        i => i.get(TWITTER_ENDPOINT, It.isAny(), It.isAny()),
        Times.exactly(3)
      );
    });

    it(`with screen_name = ${SETTINGS.screenName}`, () => {
      clientMock.verify(
        i => i.get(
          It.isAny(),
          It.is<any>(parameters => {
            expect(parameters.screen_name).to.be.equal(SETTINGS.screenName);
            return true;
          }),
          It.isAny()
        ),
        Times.exactly(3)
      );
    });

    it(`with screen_name = ${SETTINGS.screenName}`, () => {
      clientMock.verify(
        i => i.get(
          It.isAny(),
          It.is<any>(parameters => {
            expect(parameters.count).to.be.equal(SETTINGS.fetchBatchSize);
            return true;
          }),
          It.isAny()
        ),
        Times.exactly(3)
      );
    });
  });

  it('passes no max_id in the first request', () => {
      clientMock.verify(
        i => i.get(
          It.isAny(),
          It.is<any>(parameters =>
            parameters.max_id === undefined
          ),
          It.isAny()
        ),
        Times.once()
      );
  });

  it('calculates corretct max_id after first request', () => {
      clientMock.verify(
        i => i.get(
          It.isAny(),
          It.is<any>(parameters =>
            parameters.max_id === TWEETS[2].id
          ),
          It.isAny()
        ),
        Times.once()
      );
  });

  it('calculates corretct max_id for subsequent requests', () => {
      clientMock.verify(
        i => i.get(
          It.isAny(),
          It.is<any>(parameters =>
            parameters.max_id === TWEETS[4].id
          ),
          It.isAny()
        ),
        Times.atLeastOnce()
      );
  });


  it('emits all expected tweets, without duplicates and in the same order as API calls', () => {
    expect(result).to.be.eql(TWEETS);
  });
});