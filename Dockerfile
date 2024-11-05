FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update && apt-get -y dist-upgrade

RUN apt-get install build-essential cmake git

COPY . .

RUN npm ci

CMD ["node", "src/index.js"]
