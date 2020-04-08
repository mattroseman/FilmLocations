const chalk = require('chalk');

const MovieTrie = require('../lib/movieTrie.js');

// LOAD MOVIE TRIE
let movieTrie = new MovieTrie();
movieTrie.generateMovieTrie();

/*
 * handleGetMovieTitlesRequest is a function that can be passed into an express `get` method to handle requests to get movie title suggestions given a prefix. (for autocomplete)
 * @param req: the request object passed from express. Expected query params are prefix
 */
async function handleGetMovieTitlesRequest(req, res, next) {
  // if the url parameters aren't valid, respond with a 422
  if (!validateGetMovieTitlesParams(req.query)) {
    res.sendStatus(422);
    return;
  }

  const prefix = req.query.prefix;

  const cancelToken = {
    cancelled: false
  };

  req.on('close', () => {
    console.log(`movie titles request for prefix: ${prefix} cancelled`);
    cancelToken.cancelled = true;
  });

  console.log(`getting movie titles for prefix: ${prefix}`);

  let movieTitles = [];
  try {
    movieTitles = await movieTrie.getMovieTitlesFromPrefix(prefix, cancelToken);
  } catch (err) {
    if (err === 'getWords cancelled') {
      res.send(movieTitles);
      return;
    }

    console.error(chalk.red(`Something wen't wrong getting movie titles for prefix ${prefix}\n${err}`));
    next(err);
    return;
  }

  console.log(`got ${movieTitles.length} titles for prefix: ${prefix}`);

  res.send(movieTitles);
}

/*
 * validateGetMovieTitlesParams checks that the required params are present, and match what's expected
 * @return: true if the params are valid, false otherwise
 */
function validateGetMovieTitlesParams(queryParams) {
  if (!('prefix' in queryParams)) {
    return false;
  }

  return true;
}

module.exports = {
  handleGetMovieTitlesRequest
}
