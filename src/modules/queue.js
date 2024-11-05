const contributors = [];
export let nextContributor = null;

export const enqueue = (userId) => {
  contributors.push(userId);

  return contributors.length;
};

export const dequeue = () => {
  nextContributor = contributors.shift();
};
