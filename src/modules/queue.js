const contributors = [];
let nextContributor = null;

export const getNextContributor = () => nextContributor;

export const enqueue = (userId) => {
  if (contributors.includes(userId)) {
    return -1;
  }

  contributors.push(userId);

  return contributors.length;
};

export const dequeue = () => {
  nextContributor = contributors.shift();
};
