# Urban Slang


A (very) simple NodeJS application which allows loading and quick lookup of words.

## Usage

### Running the application
> The application can be accessed at [http://localhost:3000](http://localhost:3000)

> The web application is configured to load files from data/scrabble.txt

```bash
# clone repo
git clone https://github.com/NRaf/urban-slang.git

# change directory
cd urban-slang

# install dependencies
npm install

# start the server
npm start

# run the tests (optional)
npm test
```

### Using the library

#### Creating an instance
```javascript
var UrbanSlang = require('./urban-slang');
var urbanSlang = new UrbanSlang();
```

#### Loading words from a file
> One word per line, a-z, lowercase

```javascript
urbanSlang.loadWordsFromFile('filename', callback);
```

#### Manually add words
```javascript
urbanSlang.insertWord('apple');
```

#### Retrieve words
> Retrieves all words beginning with the searchTerm (with a limit of 201 words)

```javascript
urbanSlang.retrieveWords('apple');
```

## How it works

The data is stored as a tree structure, with each node being a single letter. This
leads to no duplication of data with words that begin with the same sequence, as can
be seen in the diagram below.

```
      w
    /   \
   a     o--\
 /   \       \
 s*   r*-s*   r
 |    |     /   \
 t    d*   t*    d*
 |    |    |     |
 e*   s*   h*    s*
```
> \* indicates that the letters from the root to this node spell a valid word

Can only perform searches from the start of a word. This was a conscious
decision given the requirements of the application. The structure allows for
fast searching of words beginning with a sequence of characters as well as
quick insertion.

As an example, passing 'wa' with the above data with return the values
'was', 'waste', 'war', 'wars', 'ward' and 'wards'.

## License
 [BSD](/LICENSE)