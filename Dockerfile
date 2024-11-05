FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update && apt-get -y dist-upgrade

RUN apt-get install -y build-essential cmake

COPY . .

RUN npm ci

CMD ["node", "src/index.js"]
