# tweet-fetch
Fetches account Twitter history for further processing

```
tweet-fetch [args]

Queue settings
  --queue-url, -q         RabbitMQ URL  [string] [required]
  --queue-exchange, -x    RabbitMQ target exchange  [string] [required] [default: "tweets"]
  --queue-routing-prefix  RabbitMQ routing key prefix  [string] [required] [default: "tweet"]
  --queue-app-id          RabbitMQ app id  [string] [required] [default: "fetch-tweet"]
  --queue-message-type    RabbitMQ message type  [string] [required] [default: "tweet"]

Twitter API settings
  --consumer-key          Twitter API consumer key  [string] [required]
  --consumer-secret       Twitter API consumer secret  [string] [required]
  --access-token-key      Twitter API access token key  [string] [required]
  --access-token-secret   Twitter API access token secret  [string] [required]
  --screen-name           Screen name of an account to fetch Tweets from  [string] [required]
  --fetch-batch-size, -b  Maximum number of tweets to fetch in a single batch. Keep in mind that Twitter API never returns more that 200 tweets for a single request  [number] [default: 200]

Options:
  -h, --help  Show help  [boolean]
```