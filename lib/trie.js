const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

class TrieNode {
  constructor(edgeLabel, data=[], children={}) {
    this.edgeLabel = edgeLabel;
    if (!Array.isArray(data)) {
      data = [data];
    }
    this._data = data;
    this.children = children;
  }

  get isWord() {
    // if there is any data for this node, it is a word
    return this.data.length > 0;
  }

  set data(data) {
    if (data === null) {
      return;
    }

    if (Array.isArray(data)) {
      // if this is an array, concatinate it with the current data array
      this._data = this._data.concat(data);
    } else {
      // if this is just a single object, append it to the array
      this._data.push(data);
    }
  }

  get data() {
    return this._data;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode('');
  }

  addWord(word, data=null) {
    word = word.toLowerCase();

    let currentNode = this.root;

    // iterate over each character of the given word
    for (let i = 0; i < word.length; i++) {
      const character = word[i];

      // check to see if there is a child of the current node for the current character
      if (character in currentNode.children) {
        const edgeLabel = currentNode.children[character].edgeLabel;

        // get the common prefix of this child's edgeLabel and what's left of the word
        const commonPrefix = getCommonPrefix(edgeLabel, word.substr(i));

        // if the edgeLabel and what's left of the word are the same
        if (commonPrefix.length === edgeLabel.length && commonPrefix.length === word.substr(i).length) {
          // update this child's data with the given data
          currentNode.children[character].data = data;

          return;
        }

        // if the commonPrefix is less than the edgeLabel, but equal to what's left of the word
        if (commonPrefix.length < edgeLabel.length && commonPrefix.length === word.substr(i).length) {
          // insert a new node between the currentNode and this child with the given data
          const newNode = new TrieNode(word.substr(i), data);
          newNode.children[edgeLabel[commonPrefix.length]] = currentNode.children[character]
          newNode.children[edgeLabel[commonPrefix.length]].edgeLabel = edgeLabel.substr(commonPrefix.length);
          currentNode.children[character] = newNode;

          return;
        }

        // if commonPrefix is less than both the edgeLabel and what's left of the word
        if (commonPrefix.length < edgeLabel.length && commonPrefix.length < word.substr(i).length) {
          // insert a new node between the currentNode and this child
          const newNode = new TrieNode(commonPrefix);
          // add this child as a child of new node instead of the current node
          newNode.children[edgeLabel[commonPrefix.length]] = currentNode.children[character]
          newNode.children[edgeLabel[commonPrefix.length]].edgeLabel = edgeLabel.substr(commonPrefix.length);
          currentNode.children[character] = newNode;
          // add what's left of the word as another child to the new node
          newNode.children[word.substr(i)[commonPrefix.length]] = new TrieNode(word.substr(i + commonPrefix.length), data);

          return;
        }

        // the last option is the entire edgeLabel is a prefix of what's left of the word
        // follow that edge and set this child as the currentNode
        i += edgeLabel.length - 1;
        currentNode = currentNode.children[character];
      } else {
        // make a new node that's a word and has edge label of current and remaining characters
        const newNode = new TrieNode(word.substr(i), data);
        currentNode.children[character] = newNode;

        return;
      }
    }
  }

  async getWords(prefix, cancelToken={}, expensivePrefix) {
    prefix = prefix.toLowerCase();

    let currentNode = this.root;

    // iterate over the characters of the given prefix, following the trie tree to find which node it ends at
    for (let i = 0; i < prefix.length; i++) {
      const character = prefix[i];

      if (character in currentNode.children) {
        i += currentNode.children[character].edgeLabel.length - 1;
        currentNode = currentNode.children[character];
      } else {
        // if no child can be found at any point, there aren't any words that begin with the given prefix
        return [];
      }
    }

    // DFS starting at currentNode to get all possible words with the given prefix
    let words = [];
    async function dfs(startingNode) {
      if (cancelToken.cancelled && expensivePrefix) {
        throw('getWords cancelled');
      }

      // if we are currently visiting a node that's a word
      if (startingNode.isWord) {
        // concat it's data to the running array
        words = words.concat(startingNode.data);
      }

      // if there are no child nodes return
      if (Object.keys(startingNode.children).length === 0) {
        return;
      }

      for (let character of Object.keys(startingNode.children)) {
        if (expensivePrefix) {
          // if this is an expensive prefix, don't block event loop
          await setImmediatePromise()
            .then(async () => {
              await dfs(startingNode.children[character]);
            })
        } else {
          // if this isn't an expensive prefix, process shouldn't take long, so block event loop for a very short amount of time
          // this method is quicker overall
          await dfs(startingNode.children[character]);
        }
      }
    }

    await dfs(currentNode)

    return words;
  }
}

/*
 * getCommonPrefix calculates the largest common prefix of two given strings
 */
function getCommonPrefix(a, b) {
  let commonPrefix = '';
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return commonPrefix;
    }

    commonPrefix += a[i];
  }

  return commonPrefix;
}

module.exports = Trie;
