FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update && apt-get dist-upgrade

RUN apt-get install build-base git

COPY . .

RUN npm ci

CMD ["node", "src/index.js"]
