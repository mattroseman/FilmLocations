FROM node:13.7.0

WORKDIR /usr/src/app

COPY ./package.json ./package.json

RUN npm install

COPY . .
