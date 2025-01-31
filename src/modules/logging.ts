import { Container, format, transports } from 'winston';

import { logging as config } from './config.js';

const { combine, label, prettyPrint, printf, timestamp } = format;

const loggers = {};
const container = new Container();

const createLogger = (category: string, categoryLabel) => {
  let formatter = (data) => `[${data.level}][${data.label}] ${data.message}`;
  const formatters = [label({ label: categoryLabel })];

  if (config.timestampFormat) {
    formatters.push(timestamp({ format: config.timestampFormat }));
    formatter = (data) =>
      `${data.timestamp} [${data.level}][${data.label}] ${data.message}`;
  }

  formatters.push(prettyPrint(), printf(formatter));
  container.add(category, {
    transports: [
      new transports.Console({
        level: config.level,
        format: combine(...formatters)
      })
    ]
  });

  return container.get(category);
};

export const getLogger = (category: string, categoryLabel = category) => {
  if (!loggers[category]) {
    loggers[category] = createLogger(category, categoryLabel);
  }

  return loggers[category];
};
