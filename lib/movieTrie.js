const { Movie } = require('./models.js');
const Trie = require('./trie.js');

class MovieTrieData {
  constructor(id, title, numVotes=0, year=null) {
    this.id  = id;
    this.title = title;
    this.numVotes = numVotes;
    this.year = year;
  }

  /*
   * compare takes another movie object, and determines if this movie should be ranked lower, the same, or higher than otherMovie.
   * :return: -1 if this movie should be ranked before otherMovie, 0 if they should be ranked the same, and 1 if otherMovie should be ranked before.
   */
  compare(otherMovie) {
    if (this.numVotes > otherMovie.numVotes) {
      return -1;
    }

    if (this.numVotes < otherMovie.numVotes) {
      return 1;
    }

    if (this.numVotes === otherMovie.numVotes) {
      if (this.title.length < otherMovie.title.length) {
        return -1;
      }

      if (this.title.length > otherMovie.title.length) {
        return 1;
      }
    }

    return 0;
  }
}

class MovieTrie extends Trie {
  constructor() {
    super();
  }

  /*
   * generateMovieTrie returns a promise that resolves with a Trie object containing all movie titles
   */
  async generateMovieTrie() {
    const numMovies = await Movie.find().countDocuments();

    console.time(`movie trie generated with ${numMovies} movies`);

    const movieCursor = Movie.collection.find({}).project({_id: 1, title: 1, year: 1, numVotes: 1});
    movieCursor.batchSize(10000);
    const movies = await movieCursor.toArray()
    for (const movie of movies) {
      const movieTrieData = new MovieTrieData(movie._id, movie.title, movie.numVotes, movie.year);
      const cleanedMovieTitle = cleanMovieTitle(movieTrieData.title);

      this.addWord(cleanedMovieTitle, movieTrieData);

      // if the movie has the prefix 'the ', also add the substring without the 'the ' prefix
      if (cleanedMovieTitle.substr(0, 4) === 'the ') {
        this.addWord(cleanedMovieTitle.substr(4), movieTrieData);
      }
    }
    console.timeEnd(`movie trie generated with ${numMovies} movies`);
  }

  /*
   * getMovieTitlesFromPrefix returns a promise that resolves with a list of movie titles that begin with the given prefix
   */
  async getMovieTitlesFromPrefix(prefix, cancelToken={}) {
    const cleanedPrefix = cleanMovieTitle(prefix);

    // get movies that start with the given prefix
    const movies = await this.getWords(cleanedPrefix, cancelToken, this.isExpensiveMoviePrefix(cleanedPrefix));
    console.log(`gotten list of ${movies.length} suggestions for prefix: ${prefix}`);

    // iterate through them and get the top 10 ones with most votes
    const topMovies = this.getTopMoviesByNumVotes(movies, 10);

    // sort the top movies by numVotes
    topMovies.sort((a, b) => {
      return a.compare(b);
    });

    // find any duplicate movie titles in the top 10
    const duplicateMovieTitles = topMovies.reduce((duplicateMovieTitles, movie, i, movies) => {
      movies.forEach((duplicateMovie, j) => {
        if (duplicateMovie.title === movie.title && i !== j) {
          duplicateMovieTitles.add(movie.title);
        }
      });

      return duplicateMovieTitles;
    }, new Set());

    // append a movies release year to any movies that show up as duplicates
    const movieTitles = topMovies.map((movie) => {
      if (duplicateMovieTitles.has(movie.title) && isFinite(parseInt(movie.year))) {
        movie.title += ` (${movie.year})`;
      }

      return {
        id: movie.id,
        title: movie.title
      }
    });

    return movieTitles;
  }

  /*
   * calculates if the given prefix will be an expensive prefix to look up in the prefix tree
   */
  isExpensiveMoviePrefix(prefix) {
    // If it's short or is the beginning of the string 'the ' it's considered expensive
    return prefix.length < 3 || prefix === 'the '.substr(0, prefix.length)
  }

  /*
   * getTopMoviesByNumVotes iterates through the given list of movies and grabs the top 10 by number of votes, or movie title length as secondary comparison
   * returns a list of 10 movie objects
   */
  getTopMoviesByNumVotes(movies, count=10) {
    const topMovies = movies.slice(0, count);

    movies.slice(count).forEach((movie) => {
      // get the movie in topMovies with the lowest number of votes
      let minTopMovieIndex = 0;
      const minTopMovie = topMovies.reduce((currentMinTopMovie, topMovie, i) => {
        if (topMovie.compare(currentMinTopMovie) > 0) {
          minTopMovieIndex = i;
          return topMovie;
        }

        return currentMinTopMovie;
      }, topMovies[0])

      // if movieNumVotes is greater than that movie, replace it in topMovies
      if (movie.compare(minTopMovie) < 0) {
        topMovies[minTopMovieIndex] = movie;
      }
    });

    return topMovies;
  }
}

function cleanMovieTitle(movieTitle) {
  return movieTitle.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
}

module.exports = MovieTrie;
