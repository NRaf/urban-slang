'use strict';

var searchInput = document.getElementById('searchTerm');
var resultsList = document.getElementById('results');
var filteredIndicator = document.getElementById('filteredIndicator');

var latestRequest = 0;

function findWords() {
    var requestNumber = ++latestRequest;
    var searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm.length === 0) {
        resultsList.innerHTML = '';
        filteredIndicator.classList.add('hidden');
        $('#initial-info').show();
        return;
    }

    $('#initial-info').hide();

    jQuery.getJSON('search/' + searchTerm).then(function (response) {
        if (requestNumber != latestRequest) return;
        updateDisplay(response);
    });
}

function updateDisplay(responseJSON) {
    if (responseJSON.results.length == 0) {
        resultsList.innerHTML = '<li class="notfound">no entries found</li>';
    } else {
        resultsList.innerHTML = responseJSON.results.sort().slice(0, 200).reduce(function (prev, curr) {
            return prev += '<li><a href="#" data-word="' + curr + '">' + curr + '</a></li>';
        }, '');

        filteredIndicator.classList[responseJSON.results.length > 200 ? 'remove' : 'add']('hidden');
    }
}

function errorOccurred(e) {
    //todo: proper error handling
    console.error(e);
    alert('Something went wrong.');
}

$('#results').on('click', 'a', function (e) {
    showModal($(e.target).attr('data-word'));
});

var showModal = function showModal(word) {
    $('.modal h4').html(word);
    $('.modal').modal('show');
    getDefinitions(word);
    showScore(word);
};

var BASE_API_URL = 'http://api.pearson.com';

var getDefinitions = function getDefinitions(word) {
    var $meaningsList = $('.modal #word-definitions').html('<div class="spinner" style="text-align: center"><i class="fa fa-spinner fa-2x fa-spin" aria-hidden="true"></i></div>');
    var $relatedList = $('.modal #related-definitions').html('');
    jQuery.get('http://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=' + word).then(function (res) {
        $meaningsList.find('.spinner').remove();
        if (res.results.length == 0) {
            $meaningsList.html('no definitions found');
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = res.results.filter(function (e) {
                return e.part_of_speech && e.headword.startsWith(word.substring(0, 2)) && !e.headword.includes(' ');
            }).sort(wordSort)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var aWord = _step.value;

                var audioLink = '';
                if (aWord.pronunciations) {
                    console.log(aWord.pronunciations);
                    aWord.pronunciations.forEach(function (p) {
                        return audioLink += '<a href="#" onclick="playSound(\'' + p.audio[0].url + '\')"> ' + (p.audio[0].lang.includes('British') ? 'GB' : 'US') + ': <i class="fa fa-volume-up" aria-hidden="true"></i></a>';
                    });
                }
                // else if (aWord.senses && aWord.senses[0].examples && aWord.senses[0].examples[0].audio) {
                //     audioLink = `<a href="#" onclick="playSound('${aWord.senses[0].examples[0].audio[0].url}')"><i class="fa fa-volume-up" aria-hidden="true"></i></a>`;
                // }

                console.log(JSON.stringify(aWord, null, ' '));

                var definition = '<dt>' + aWord.headword + ' (' + aWord.part_of_speech + ') ' + audioLink + '</dt><dd>' + aWord.senses[0].definition + ' <!--a href="' + (BASE_API_URL + aWord.url) + '" target="_blank">(more)</a--></dd>';
                aWord.headword.toLowerCase() === word.toLowerCase() ? $meaningsList.append(definition) : $relatedList.append(definition);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        $('.modal #related-section')[$relatedList.find('dt').length ? 'show' : 'hide']();
    });
};

var exampleSearch = function exampleSearch() {
    return (searchInput.value = 'word') && findWords();
};

var wordSort = function wordSort(a, b) {
    return a.headword < b.headword ? -1 : a.headword > b.headword ? 1 : 0;
};

var playSound = function playSound(url) {
    return new Audio(BASE_API_URL + url).play();
};

var scores = {};
['eaionrtlsu', 'dg', 'bcmp', 'fhvwy', 'k', 'jx', 'qz'].forEach(function (letters, index) {
    return letters.split('').forEach(function (l) {
        return scores[l] = index < 5 ? index + 1 : index == 5 ? 8 : 10;
    });
});
var getScore = function getScore(word) {
    return word.split('').reduce(function (p, c) {
        return p + (scores[c] || 0);
    }, 0);
};

var showScore = function showScore(word) {
    return $('.modal #score').html(getScore(word));
};