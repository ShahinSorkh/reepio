FROM node:0.12

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
    && sudo -u reepio cp public/config.dist.js public/config.js \
    && sudo -u reepio npm install \
    && sudo -u reepio npm run build

WORKDIR /data
USER reepio

EXPOSE 9001

CMD ["npm", "run", "start"]