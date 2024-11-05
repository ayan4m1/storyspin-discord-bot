import { generateRandomHexColor } from '../utils';

const contributorColors = new Map();
const contributors = [];
let nextContributor = null;

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
