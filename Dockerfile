
FROM node:lts

# Replace `x86_64` with `sbsa` for ARM64
ENV NVARCH=x86_64
ENV INSTALL_CUDA_VERSION=12.4

SHELL ["/bin/bash", "-c"]
RUN apt-get update && \
    apt-get install -y --no-install-recommends gnupg2 curl ca-certificates && \
    curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/${NVARCH}/3bf863cc.pub | apt-key add - && \
    echo "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/${NVARCH} /" > /etc/apt/sources.list.d/cuda.list && \
    apt-get purge --autoremove -y curl && \
    rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    "cuda-cudart-${INSTALL_CUDA_VERSION//./-}" \
    "cuda-compat-${INSTALL_CUDA_VERSION//./-}" \
    "cuda-libraries-${INSTALL_CUDA_VERSION//./-}" \
    "libnpp-${INSTALL_CUDA_VERSION//./-}" \
    "cuda-nvtx-${INSTALL_CUDA_VERSION//./-}" \
    "libcusparse-${INSTALL_CUDA_VERSION//./-}" \
    "libcublas-${INSTALL_CUDA_VERSION//./-}" \
    git cmake clang libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN apt-mark hold "libcublas-${INSTALL_CUDA_VERSION//./-}"

RUN echo "/usr/local/nvidia/lib" >> /etc/ld.so.conf.d/nvidia.conf \
    && echo "/usr/local/nvidia/lib64" >> /etc/ld.so.conf.d/nvidia.conf

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all

WORKDIR /usr/src/app
COPY . .

RUN npm ci

RUN npm run build

CMD ["node", "lib/index.js"]