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

    jQuery.getJSON(`/search/${searchTerm}`).then(function(response) {
        if (requestNumber != latestRequest) return;
        updateDisplay(response);
    });
}

function updateDisplay(responseJSON) {
    if (responseJSON.results.length == 0) {
        resultsList.innerHTML = '<li class="notfound">no entries found</li>';
    } else {
        resultsList.innerHTML = responseJSON.results.sort().slice(0, 200).reduce(function(prev, curr) {
            return prev += `<li><a href="#" data-word="${curr}">${curr}</a></li>`;
        }, '');

        filteredIndicator.classList[responseJSON.results.length > 200 ? 'remove' : 'add']('hidden');
    }
}

function errorOccurred(e) {
    //todo: proper error handling
    console.error(e);
    alert('Something went wrong.');
}

$('#results').on('click', 'a', e => {
    showModal($(e.target).attr('data-word'));
});

$('body').on('click', 'a.inline-word', e => {
    showModal($(e.target).attr('data-word'));
    e.preventDefault();
    return false;
});

const showModal = word => {
    $('.modal h4').html(word);
    $('.modal').modal('show');
    loadWord(word);
}

const loadWord = word => {
    getDefinitions(word);
    showScore(word);
}

var BASE_API_URL = 'http://api.pearson.com';

const getDefinitions = word => {
    var $meaningsList = $('#word-definitions').html('<div class="spinner" style="text-align: center"><i class="fa fa-spinner fa-2x fa-spin" aria-hidden="true"></i></div>');
    var $relatedList = $('#related-definitions').html('');
    jQuery.get(`http://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=${word}`)
    .then(res => {
        $meaningsList.find('.spinner').remove();
        if (res.results.length == 0) {
            $meaningsList.html('no definitions found');
        }

        for (var aWord of res.results.filter(e => e.part_of_speech && e.headword.startsWith(word.substring(0,2)) && !e.headword.includes(' ')).sort((a, b) => Levenshtein(word, a.headword) - Levenshtein(word, b.headword))) {
            var audioLink = '';
            if (aWord.pronunciations) {
                console.log(aWord.pronunciations);
                aWord.pronunciations.forEach(p => audioLink += `<a href="#" onclick="playSound('${p.audio[0].url}')"> ${p.audio[0].lang.includes('British') ? 'GB' : 'US'}: <i class="fa fa-volume-up" aria-hidden="true"></i></a>`);
            } 
            // else if (aWord.senses && aWord.senses[0].examples && aWord.senses[0].examples[0].audio) {
            //     audioLink = `<a href="#" onclick="playSound('${aWord.senses[0].examples[0].audio[0].url}')"><i class="fa fa-volume-up" aria-hidden="true"></i></a>`;
            // }

            console.log(JSON.stringify(aWord, null, ' '));

            var definition = `<dt>${aWord.headword} (${aWord.part_of_speech}) ${audioLink}</dt><dd>${aWord.senses[0].definition} <!--a href="${BASE_API_URL + aWord.url}" target="_blank">(more)</a--></dd>`;
            aWord.headword.toLowerCase() === word.toLowerCase() ? $meaningsList.append(definition) : $relatedList.append(definition);
        }

        $('#related-section')[$relatedList.find('dt').length ? 'show' : 'hide']();

        $('#view-word-details').attr('href', '/word/' + word);
    });
}

const exampleSearch = () => (searchInput.value = 'word') && findWords();

const playSound = url => new Audio(BASE_API_URL + url).play();
 
const scores = {};
['eaionrtlsu', 'dg', 'bcmp', 'fhvwy', 'k', 'jx', 'qz'].forEach((letters, index) => letters.split('').forEach(l => scores[l] = index < 5 ? index+1 : (index == 5 ? 8 : 10)));
const getScore = word => word.split('').reduce((p, c) => p + (scores[c] || 0), 0);
const createScrabbleTiles = word => word.split('').reduce(($el, c) => 
    $el.append(createScrabbleTile(c, scores[c])), 
    $('<div class="scrabble-word">')
);

const createScrabbleTile = (letter, score) => $(`
    <div class="scrabble-tile">
        <div class="letter">${letter}</div>
        <div class="score">${score}</div>
    <div>`
);

const showScore = word => {
    const $equalsTile = createScrabbleTile('=', '').addClass('equals');
    const $scoreTile = createScrabbleTile(getScore(word), '');
    $('#score').html(createScrabbleTiles(word).append($equalsTile).append($scoreTile));
}