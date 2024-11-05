const contributors = [];

export const enqueue = (userId) => {
  contributors.push(userId);

  return contributors.length;
};

export const dequeue = () => {
  return contributors.shift();
};
