import Bottleneck from 'bottleneck';
import { generateRandomHexColor } from '../utils/index.js';

const rateLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000
});
const contributorColors = new Map<string, number>();
const contributors: string[] = [];
let nextContributor: string = null;

export const getNextContributor = () => nextContributor;

export const queueUser = (userId) => {
  if (contributors.includes(userId)) {
    return -1;
  }

  contributors.push(userId);

  return contributors.length;
};

export const advanceContributors = () => {
  nextContributor = contributors.shift();
};

export const getContributorColor = (userId) => {
  if (!contributorColors.has(userId)) {
    const newColor = generateRandomHexColor();

    contributorColors.set(userId, newColor);
  }

  return contributorColors.get(userId);
};

export const queueTask = <R>(fn: PromiseLike<R>): Promise<R> =>
  rateLimiter.schedule<R>(() => fn);
