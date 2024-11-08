FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update && apt-get -y dist-upgrade

RUN apt-get install -y build-essential cmake

RUN wget -nv https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin && \
    mv cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600 && \
    wget -nv https://developer.download.nvidia.com/compute/cuda/12.6.2/local_installers/cuda-repo-ubuntu2404-12-6-local_12.6.2-560.35.03-1_amd64.deb && \
    dpkg -i cuda-repo-ubuntu2404-12-6-local_12.6.2-560.35.03-1_amd64.deb && \
    cp /var/cuda-repo-ubuntu2404-12-6-local/cuda-*-keyring.gpg /usr/share/keyrings/ && \
    apt-get update && \
    apt-get -y install cuda-toolkit-12-6

RUN npx -y node-llama-cpp source download --gpu cuda

COPY . .

RUN npm install

RUN npm run build

CMD ["node", "lib/index.js"]
