const contributors = [];

export const enqueue = (userId) => {
  contributors.push(userId);
};

export const dequeue = () => {
  return contributors.shift();
};
