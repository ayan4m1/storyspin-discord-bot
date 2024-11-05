FROM node:lts-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm ci

CMD ["node", "src/index.js"]
