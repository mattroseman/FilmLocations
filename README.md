# Film Locations

Interactive map of filming locations around the world. Built with a Node backend and React frontend, with [Leafletjs](https://leafletjs.com/) for the interactive map.

## Installation

This project is built around [docker](https://www.docker.com/products/docker-desktop), but can be run without it.

### Database

To connect to a MongoDB instance not through docker, update the credentials file `credentials/mongodb.json` with your connection information.

To initialize the database start the `mongodb` docker image with `docker-compose up -d mongodb`.
To connect to the MongoDB database running in docker.
`dcr mongodb mongo --host mongodb --username film_locations_user --password film_locations_pass --authenticationDatabase admin film_locations`

To generate the database run `docker-compose run --rm get_film_locations`.
This requires a connection to [Google's Geocoding API](https://developers.google.com/maps/documentation/geocoding/intro) which can be configured in `credentials/google.json`.
This is not a free API, so be aware of billing before running. There will be around 100,000 requests made to it.
In the future I'm planning to add some test data so that this script doesn't need to run.

### Website

If you aren't using the docker images, you'll need to run `npm install` and `npm run build`
Otherwise the commands in Dockerfile and docker-compose.yml will take care of these steps.

The website can be started with `docker-compose up -d film_locations` and accessed at `localhost:5000`.
This runs the `start-dev` npm command, which runs the express server with nodemon. Any changes to server code will trigger a refresh.

If you want to hot reaload the frontend code you can also run the command `docker-compose up -d film_locations_dev_server` and access it at `localhost:3000`.
This starts a webpack hotreload server that connects to the backend running on `localhost:5000`.
So any changes to frontend or backend code will trigger a refresh and can be seen immediately.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Authors

* **Matthew Roseman** - *Initial work* - [mroseman95](https://github.com/mroseman95)

See also the list of [contributors](https://github.com/mroseman95/FilmLocations/contributors) who participated in this project.

## License
[MIT](https://choosealicense.com/licenses/mit/)
