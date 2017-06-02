FROM node:7.10

COPY ./ /var/www
WORKDIR /var/www

RUN apt-get update && apt-get install -y curl tar

RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 0.24.2

#MONGO START
RUN dpkg-divert --local --rename --add /sbin/initctl
#RUN ln -s /bin/true /sbin/initctl
RUN dpkg-divert --local --rename --add /etc/init.d/mongod
RUN ln -s /bin/true /etc/init.d/mongod
RUN \
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927 && \
echo 'deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse' > /etc/apt/sources.list.d/mongodb.list && \
apt-get update && \
apt-get install -yq mongodb-org
RUN mkdir /data/
RUN mkdir /data/db
RUN mongod --fork --logpath /var/log/mongodb.log
#MONGO END

#RABBIT START
# Install RabbitMQ.
RUN echo 'deb http://www.rabbitmq.com/debian/ testing main' | tee /etc/apt/sources.list.d/rabbitmq.list

RUN wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | apt-key add -

RUN apt-get update && apt-get install -y rabbitmq-server

RUN service rabbitmq-server start

RUN rabbitmq-plugins enable rabbitmq_stomp

RUN service rabbitmq-server restart
#RABBIT END


RUN npm install -g node-gyp-install pm2 && \
    node-gyp-install && \
    yarn && yarn build

EXPOSE 4040
EXPOSE 1337
EXPOSE 27017

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
