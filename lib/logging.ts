import * as winston from 'winston';

function createLogger(...component: string[]): winston.LoggerInstance {
  return new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        label: component.join('.'),
        name: 'console',
        timestamp: new Date().toISOString()
      })
    ]
  });
}

export default createLogger;