FROM node:lts-alpine

WORKDIR /usr/src/app

COPY . .

RUN apk add build-base git

RUN npm ci

CMD ["node", "src/index.js"]
