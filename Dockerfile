FROM node:13.7.0

WORKDIR /usr/src/app

COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN npm install

COPY . .

# ENVIRONMENT VARIABLES
ENV ENVIRONMENT production
ENV DB_BULK_OP_MAX_SIZE 10000
ENV MAX_CONCURRENT_REQUESTS 50
ENV RELEVANT_MOVIE_VOTE_MIN 100
ENV PORT ${PORT:-8080}

RUN npm run build

# RUN COMMAND
CMD ["npm", "start"]
