FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update && apt-get -y dist-upgrade

RUN apt-get install -y build-essential cmake

COPY . .

RUN npm ci

RUN npx node-llama-cpp source download --gpu cuda

RUN npx node-llama-cpp source build

CMD ["node", "src/index.js"]
