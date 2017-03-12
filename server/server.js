var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();
var data = require('../kladr.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

function anyCase(a, b) {
    if (a.City.toLowerCase() > b.City.toLowerCase()) {
        return 1;
    } if (a.City.toLowerCase() < b.City.toLowerCase()) {
        return -1;
    } else {
        return 0;
    }
}

function Unique(A) {
    var n = A.length, k = 0, B = [];
    for (var i = 0; i < n; i++) { 
        var j = 0;
        while (j < k && B[j] !== A[i]) j++;
        if (j == k) B[k++] = A[i];
    }

    return B;
}

var sortedElements = data.sort(anyCase);
sortedElements = Unique(sortedElements);

app.post('/firstelements', function(req, res) {
    res.send(firstElements);
});

app.post('/getelements', function(req, res) {
    let firstElementPosition = req.body.firstElementPosition;
    let lastElementPosition = req.body.lastElementPosition;
    let searchString = req.body.searchString;

    let result = [];

    if (searchString) {        
        result = data.filter(function(item) {
            var template = new RegExp(`^${searchString}.*`, 'gi');
            return (item.City.match(template));    
        });
        result = result.slice(firstElementPosition, lastElementPosition);
    } else {
        result = sortedElements.slice(firstElementPosition, lastElementPosition);
    }
    
    res.send(result);
});

app.post('/add', function(req, res) {
    let added = false;
    let searchString = req.body.searchString;
    if (typeof searchString === 'string') {
        console.log(data.length);
        data.push({
            Id: data.length,
            City: searchString 
        });
        added = true;
    }
    res.send(added);
});

app.listen(3090, function() {
    console.log('Started on 3090');
})