const zlib = require('zlib');
const https = require('https');

const IMDB_MOVIE_FILE_URL = 'https://datasets.imdbws.com/title.basics.tsv.gz';

/*
 * getMovies downloads and processes a list of basic movie info from IMDb and adds them to a PostgreSQL database
 */
async function getMovies() {

  const basicInfoLines = await downloadMovieFile();

  for await (const line of basicInfoLines) {
    const movieInfo = processLine(line);

    if (movieInfo === null) {
      continue;
    }

    // TODO check if the movie is in the PostgreSQL database
    // TODO add if if it's not already in there
    await addMovieToDB(movieInfo);
  }
}

/*
 * downloadMovieFile queries IMDb to get a zipped file, unzips it, and yields it line by line
 * @return: an aynchronous iterable over the lines of the basic movie file
 */
async function* downloadMovieFile() {
  // download and unzip the basics file
  const unzippedStream = await new Promise((resolve, reject) => {
    const unzip = zlib.createUnzip();

    https.get(IMDB_MOVIE_FILE_URL, (res) => {
      resolve(res.pipe(unzip));
    }).on('error', (err) => {
      reject(err);
    });
  });

  // iterate over the unzipped chunks of the stream yielding complete lines
  let previous = '';
  for await (const chunk of unzippedStream) {
    previous += chunk;

    while (true) {
      const eolIndex = previous.indexOf('\n');
      if (eolIndex < 0) {
        break;
      }

      // if eol is in previous, split it and yield everything up to it
      const line = previous.slice(0, eolIndex);
      yield line;

      // then reset previous to everything after the eol
      previous = previous.slice(eolIndex + 1);
    }
  }

  if (previous.length > 0) {
    yield previous;
  }
}

/*
 * processLine takes a line from the IMDb basic movie info file, and, if it's a movie, parses out the relevant data
 * @param line: a String that's the line from the IMDb basic movie file
 * @return: if the line is of a movie, returns an object with the parsed out details, or null if it's not a movie
 */
function processLine(line) {
  const data = line.split('\t');

  // if this isn't a movie
  if (data[1] !== 'movie') {
    return null;
  }

  const id = data[0];
  const title = data[2];
  const year = isFinite(+data[5]) ? +data[5] : null;

  return {id, title, year};
}

/*
 * addMovieToDB takes a movie, checks if it already exists in the database, and if not adds it
 * @param movie: an object containing relevant movie information
 */
function addMovieToDB(movie) {
  console.log(movie);
}

(async () => {
  await getMovies();
})();
