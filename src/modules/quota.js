import Bottleneck from 'bottleneck';

import { quota as config } from './config.js';

const limiter = new Bottleneck({
  maxConcurrent: config.concurrency,
  minTime: (1 / config.requestsPerMinute) * 60 * 1000
});

export const queue =
  (task) =>
  (...args) =>
    limiter.schedule(() => task(...args));
