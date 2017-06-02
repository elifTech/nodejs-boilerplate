FROM node:7.10

COPY ./ /var/www
WORKDIR /var/www

RUN apt-get update && apt-get install -y curl tar

RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 0.24.2


RUN npm install -g node-gyp-install pm2 && \
    node-gyp-install && \
    yarn && yarn build

EXPOSE 4040
EXPOSE 1337

RUN npm i console-io -g

# Remove the packages that are no longer required after the package has been installed
RUN DEBIAN_FRONTEND=noninteractive apt-get autoremove --purge -q -y
RUN DEBIAN_FRONTEND=noninteractive apt-get autoclean -y -q
RUN DEBIAN_FRONTEND=noninteractive apt-get clean -y
#
# Remove all non-required information from the system to have the smallest
# image size as possible
RUN rm -rf /usr/share/doc/* /usr/share/man/?? /usr/share/man/??_* /usr/share/locale/* /var/cache/debconf/*-old /var/lib/apt/lists/* /tmp/*

CMD pm2 start dist/index.js && console
