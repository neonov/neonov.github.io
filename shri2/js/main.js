/**
 * Реализация API, не изменяйте ее
 * @param {string} url
 * @param {function} callback
 */
function getData(url, callback) {
  var RESPONSES = {
    '/countries': [
      {name: 'Cameroon', continent: 'Africa'},
      {name :'Fiji Islands', continent: 'Oceania'},
      {name: 'Guatemala', continent: 'North America'},
      {name: 'Japan', continent: 'Asia'},
      {name: 'Yugoslavia', continent: 'Europe'},
      {name: 'Tanzania', continent: 'Africa'}
    ],
    '/cities': [
      {name: 'Bamenda', country: 'Cameroon'},
      {name: 'Suva', country: 'Fiji Islands'},
      {name: 'Quetzaltenango', country: 'Guatemala'},
      {name: 'Osaka', country: 'Japan'},
      {name: 'Subotica', country: 'Yugoslavia'},
      {name: 'Zanzibar', country: 'Tanzania'},
    ],
    '/populations': [
      {count: 138000, name: 'Bamenda'},
      {count: 77366, name: 'Suva'},
      {count: 90801, name: 'Quetzaltenango'},
      {count: 2595674, name: 'Osaka'},
      {count: 100386, name: 'Subotica'},
      {count: 157634, name: 'Zanzibar'}
    ]
  };

  setTimeout(function () {
    var result = RESPONSES[url];
    if (!result) {
      return callback('Unknown url');
    }

    callback(null, result);
  }, Math.round(Math.random * 1000));
}

/**
 * Ваши изменения ниже
 */
var requests = ['/countries', '/cities', '/populations'];
var responses = {};

for (i = 0; i < 3; i++) {
  (function(){
    var request = requests[i];
    var j = i;
    var callback = function (error, result) {
      responses[requests[j]] = result;
      var l = [];
      for (var K in responses)
        l.push(K);

      if (l.length == 3) {
        askUser(responses);
      }
    };

  getData(request, callback);
  })();
}

var askUser = function(responses) {
  var population;
  name = window.prompt('Enter name of continet, country or city of which population you want to know', 'Africa');

  population = getPopulation(name);
  printPopulation(name, population);
};

var getPopulation = function (name) {
  var population = 0;

  if (isCity(name)) {
    population = getCityPopulation(name );
  } else if (isCountry(name)) {
    population = getCountryPopulation(name  );
  } else if (isContinent(name)) {
    population= getContinentPopulation(name );
  }

  return population;
};

var isCity = function(name) {
  var cities, city;
  cities = responses['/cities'];
  city = cities.filter( function(city) {
    return city.name == name;
  });

  return city.length ? true : false;
};

var isCountry = function(name) {
  var countries, country;
  countries = responses['/countries'];
  country = countries.filter( function(country) {
    return country.name == name;
  });

  return country.length ? true : false;
};

var isContinent = function(name) {
  var continents, continent;
  continents = responses['/countries'];
  continent = continents.filter( function(countries) {
    return countries.continent == name;
  });

  return continent.length ? true : false;
};

var getCityPopulation = function(name) {
  var city, cities, population = 0;
  populations = responses['/populations'];
  city = populations.filter( function(population) {
    return population.name == name;
  });

  if (city) {
    return population = city[0].count;
  } else {
    return 0;
  }
};

var getCountryPopulation = function(name) {
  var cities;
  cities = responses['/cities'].filter( function(city) {
    return city.country == name;
  });

  if (cities.length) {
    return cities.reduce( function (prev, curr) {
      return prev + getCityPopulation(curr.name);
    }, 0);
  } else {
    return 0;
  }
};


var getContinentPopulation = function (name) {
  var countries;
  countries = responses['/countries'].filter( function(country) {
    return country.continent == name;
  });

  if (countries.length) {
    return countries.reduce( function (prev, curr) {
      return prev + getCountryPopulation(curr.name);
    }, 0);
  } else {
    return 0;
  }
};

var printPopulation = function(name, population) {
  if (population) {
    alert('The population of ' + name + ' is ' + population);
  }
  else {
    alert('Ooops! ' + name + ' is incorrect value!');
  }
};

  