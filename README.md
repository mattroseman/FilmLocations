# Film Locations

Interactive map of filming locations around the world. Built with a Node backend and React frontend, with d3.js for interactive map.

## Installation

This project requires [docker](https://www.docker.com/products/docker-desktop) to run.

After cloning, the docker image can be built with `docker-compose build get_film_locations`.
A local MongoDB instance can also be pulled and setup with `docker-compose up -d mongodb`.

To connect to the MongoDB database running in docker.
`dcr mongodb mongo --host mongodb --username film_locations_user --password film_locations_pass --authenticationDatabase admin film_locations`

Also when generating the data, the script hits the [Google's geocoding API](https://developers.google.com/maps/documentation/geocoding/start).
The file `/credentials/google.json` should be updated with a google geocoding API key.

## Usage
The script to build the database can be run with `docker-compose run --rm get_film_locations`,
this will run three scripts `get-movies.js`, `get-locations.js`, and `get-coordinates.js`.

`get-movies.js` downloads the bulk csv files from IMDb containing lists of all movies, and rating information on them, then adds them to a MongoDB database.
`get-locations.js` iterates through all the movies in the database, and scrapes location info from IMDb. Locations are added to database with references to their movies.
`get-coordinates.js` iterates through all the locations in the database, and hits the google geolocation API to get latitude/longitude coordinates.


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Authors

* **Matthew Roseman** - *Initial work* - [mroseman95](https://github.com/mroseman95)

See also the list of [contributors](https://github.com/mroseman95/FilmLocations/contributors) who participated in this project.

## License
[MIT](https://choosealicense.com/licenses/mit/)
