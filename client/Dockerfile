FROM node:16.17.0 AS build
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.22
WORKDIR /usr/share/nginx/html
COPY --from=build /usr/src/app/public .
COPY --from=build /usr/src/app/dist .
