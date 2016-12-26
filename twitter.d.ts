declare module 'twitter' {
  interface TwitterApiSettings {
    consumer_key: string;
	  consumer_secret: string;
	  access_token_key: string;
	  access_token_secret: string;
  }

  interface TwitterClient {
    get<TResult>(
      endpoint: string,
      params: any,
      callback: (error: Error, result: TResult) => void
    );
  }

  interface TwitterClientFactory {
    new (settings?: TwitterApiSettings): TwitterClient
  }

  const Twitter: TwitterClientFactory;
  export = Twitter;
}