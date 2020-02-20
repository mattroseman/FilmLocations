FROM node:13.7.0

WORKDIR /usr/src/app

COPY ./package.json ./package.json

RUN npm install

COPY . .

# ENVIRONMENT VARIABLES
ENV ENVIRONMENT production
ENV RELEVANT_MOVIE_VOTE_MIN 100

# RUN COMMAND
CMD ["npm", "start"]
