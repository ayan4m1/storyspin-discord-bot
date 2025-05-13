FROM node:lts

SHELL ["/bin/bash", "-c"]
RUN apt-get update && \
    apt-get install -y --no-install-recommends git cmake clang libgomp1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY . .

RUN npm ci

RUN npm run build

CMD npm start