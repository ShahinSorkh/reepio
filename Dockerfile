FROM node:0.12

ARG NODE=production
ENV NODE_ENV ${NODE}

RUN apt-get update \
    && apt-get install -y \
       git \
       sudo \
       rsync \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd -r --shell /bin/bash --create-home reepio

RUN mkdir -p /data \
    && cd /data \
    && chown -R reepio:reepio /data \
    && sudo -u reepio git clone https://github.com/KodeKraftwerk/reepio.git ./ \
    && sudo -u reepio cp config/config.dist.js config/config.${NODE_ENV}.js \
    && sudo -u reepio cp config/config.${NODE_ENV}.js public/config.js \
    && sudo -u reepio npm install \
    && sudo -u reepio NODE_ENV=${NODE_ENV} npm run build

WORKDIR /data
USER reepio

EXPOSE 9001

CMD ["npm", "run", "start"]