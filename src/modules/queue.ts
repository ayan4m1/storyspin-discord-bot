import Bottleneck from 'bottleneck';

const rateLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000
});

export const queueTask = <R>(fn: PromiseLike<R>): Promise<R> =>
  rateLimiter.schedule<R>(() => fn);
