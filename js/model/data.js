'use strict';

import { domain } from './domain.js';
import { store } from './yetAnotherLocalStorageWrapper.js';
import { countryAliases } from './population.js';
import { Countries } from './countries.js';
import { Measure } from './measure.js';
import { readToggles, getToggle, setToggle, forEachToggle } from './toggles.js';

// toggles
readToggles();

// measure
const measure = Measure();

// countries
const countriesHolder = Countries();

// dates
const parseDate = d3.timeParse("%Y-%m-%d");
let startDate;
let endDate;
let setStartDate;
{
    const defaultStart = moment("2020-01-21");
    // start date
    let readStartDate = () => {
        const startAsDayOfYear = store.get("startAsDayOfYear", defaultStart.dayOfYear());
        const startDate = moment().dayOfYear(startAsDayOfYear);
        return startDate;
    };
    setStartDate = (s, nosave) => {
        startDate = s;
        if (!nosave) {
            if (s.isSame(defaultStart, 'day')) {
                store.remove("startAsDayOfYear");
            } else {
                store.set("startAsDayOfYear", startDate.dayOfYear());
            }
        }
        return startDate;
    }
    function readEndDate() {
        return moment();
    };
    startDate = readStartDate();
    endDate = readEndDate();
}

// size of average
function calcMovingAverage(data, country) {
    if (!data[country]) {
        return;
    }
    _.each(measure.typesArray, (m) => {
        const deltas = _.map(data[country], 'delta.' + m);
        let deltasMovingAverage = sma(deltas, sizeOfAverage, x => x);

        let i = 1;
        data[country].forEach((d) => {
            if (i <= sizeOfAverage) {
                d.deltaMovingAverage[m] = d.total[m] / i;
            } else {
                d.deltaMovingAverage[m] = deltasMovingAverage[i - sizeOfAverage];
            }
            i = i + 1;
        });
    });
}
const maxSizeOfAverage = 21;
const defaultSizeOfAverage = 21;
let sizeOfAverage = undefined;
let setSizeOfAverage = (s, nosave) => {
    if (s <= 0 || maxSizeOfAverage < s) {
        return;
    }
    if (sizeOfAverage !== s) {
        sizeOfAverage = s;
        const countries = countriesHolder.get();
        countries.forEach((country) => {
            if (massagedData && massagedData.data) {
                calcMovingAverage(massagedData.data, country);
            }
        });
        if (!nosave) {
            if (sizeOfAverage == 21) {
                store.remove("sizeOfAverage");
            } else {
                store.set("sizeOfAverage", sizeOfAverage);
            }
        }
    }
};
{
    let storedSizeOfAverage = store.get("sizeOfAverage", defaultSizeOfAverage);
    if (storedSizeOfAverage) {
        // "Always specify a radix to avoid (...) unreliable behavior" 
        // cf. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
        storedSizeOfAverage = parseInt(storedSizeOfAverage, 10);
    }
    sizeOfAverage = storedSizeOfAverage || defaultSizeOfAverage;
}

// massage data
let rawData = undefined;
let massagedData = undefined;
function massageData() {
    if (!massagedData || !rawData) {
        throw "where is the data?";
    }

    if (!massagedData.data) {
        _.each(countryAliases, (newKey, key) => {
            if (!rawData[newKey] && rawData[key]) {
                rawData[newKey] = rawData[key];
                delete rawData[key];
            }
        });
    }

    let data = massagedData.data || {};

    const countries = countriesHolder.get();

    // parse dates & integerify other attributes
    countries.forEach((country) => {
        if (!data[country] && rawData[country]) {
            data[country] = _.cloneDeep(rawData[country]);
            data[country].forEach(d => {
                d.date = parseDate(d.date);
                d.confirmed = +d.confirmed;
                d.deaths = +d.deaths;
                d.recovered = +d.recovered;
            });
        }
    });

    let latest = new moment("2020-01-01");
    let earliest = moment();

    // compute delta
    if (countries.length > 0) {

        countries.forEach((country) => {
            if (!data[country]) {
                console.log(country, "OUILLEE, no data !?");
            } else {
                if (data[country].done) {
                    return;
                }

                const thisMax = moment(_.maxBy(data[country], 'date').date);
                latest = moment.max(latest, thisMax);
                const thisMin = moment(_.minBy(data[country], 'date').date);
                earliest = moment.min(earliest, thisMin);

                let previousMeasure = _.clone(measure.typesObject);
                data[country].forEach((d) => {
                    d.delta = _.clone(measure.typesObject);
                    d.total = _.clone(measure.typesObject);
                    d.deltaMovingAverage = _.clone(measure.typesObject);
                    _.each(measure.typesArray, (m) => {
                        d.total[m] = d[m];
                        d.delta[m] = d[m] - previousMeasure[m];
                        previousMeasure[m] = d[m];
                    });
                });
                data[country].done = true;
                console.log("massaged", country);
            }
        });
        /*
        latest.subtract(2, 'days');
        earliest.subtract(1, 'days');
        */
    }

    countries.forEach((country) => {
        calcMovingAverage(data, country);
    });

    massagedData.data = data;
    massagedData.latest = latest;
    massagedData.earliest = earliest;

    return massagedData;
}

let categories;
let lasts;
function setLasts(categories) {

    lasts = _.transform(categories, (result, value, key) => (result.push({
        name: value.category,
        nummer: value.datapoints.length > 1 ? value.datapoints[value.datapoints.length - 1].nummer : 0,
    })), []);

    lasts.sort((a, b) => {
        return b.nummer - a.nummer;
    });
}

function setupCategories() {
    const isPercapita = getToggle("toggleCapita") === "percapita";
    const isTotal = getToggle("toggleCumula") === "total";
    const measureType = measure.getType();
    const countries = countriesHolder.get();
    const countryMap = countriesHolder.getAsMap();

    function which(country, d) {
        let nummer;
        let tot;
        if (isTotal) {
            nummer = d.total[measureType];
            tot = d.total.deaths;
        } else {
            if (sizeOfAverage < 2) {
                nummer = d.delta[measureType];
                tot = d.delta.deaths;
            } else {
                nummer = d.deltaMovingAverage[measureType];
                tot = d.deltaMovingAverage.deaths;
            }
        }
        if (isPercapita) {
            const pop = countryMap[country].count;
            nummer = 1000000 * nummer / pop;
            tot = 1000000 * tot / pop;
        }
        return { nummer: nummer, tot: tot, date: d.date };
    }

    // reformat data to make it more copasetic for d3
    categories = countries.map((country) => {
        let points = []
        if (massagedData.data[country]) {
            points = _.map(_.filter(massagedData.data[country], (d) => moment(d.date).isSameOrAfter(startDate)), (d) => which(country, d));
        }
        return {
            category: country,
            datapoints: points,
        };
    });

    setLasts(categories);

    return categories;
}

// Read in data
function fetchData(callback) {
    $.ajax({
        type: 'GET',
        url: 'https://pomber.github.io/covid19/timeseries.json',
        dataType: 'json',
        success: function (data) {
            rawData = data;
            massagedData = {
                data: undefined,
                latest: undefined,
                earliest: undefined,
            };

            massageData();

            setSizeOfAverage(sizeOfAverage, true);

            return callback(massagedData);
        }
    });
}

export function init(queryStringParams) {
    // query parameters
    if (queryStringParams) {
        if (queryStringParams.reset) {
            store.clear();
            window.location = ".";
        }
        if (queryStringParams.measure) {
            measure.setType(queryStringParams.measure, !queryStringParams.store);
        }
        if (queryStringParams.toggleLinear) {
            setToggle("toggleLinear", queryStringParams.toggleLinear, !queryStringParams.store);
        }
        if (queryStringParams.toggleCumula) {
            setToggle("toggleCumula", queryStringParams.toggleCumula, !queryStringParams.store);
        }
        if (queryStringParams.toggleCapita) {
            setToggle("toggleCapita", queryStringParams.toggleCapita, !queryStringParams.store);
        }
        if (queryStringParams.toggleDeaths) {
            setToggle("toggleDeaths", queryStringParams.toggleDeaths, !queryStringParams.store);
        }
        if (queryStringParams.startDate) {
            setStartDate(queryStringParams.startDate, !queryStringParams.store);
        }
        if (queryStringParams.sizeOfAverage) {
            setSizeOfAverage(queryStringParams.sizeOfAverage, !queryStringParams.store);
        }
        if (queryStringParams.countries && queryStringParams.countries.length > 0) {
            let countries = queryStringParams.countries;
            if (queryStringParams.addCountries) {
                countries = countries.concat(countriesHolder.get());
            }
            if (queryStringParams.store) {
                countriesHolder.write(countries);
            } else {
                countriesHolder.set(countries);
            }
        }
        if (queryStringParams.selectedCountry && queryStringParams.selectedCountry.length > 0) {
            countriesHolder.setSelectedCountry(queryStringParams.selectedCountry, !queryStringParams.store);
        }
    }

    return {
        domain: domain,

        getCountriesHolder: () => countriesHolder,

        getMeasure: () => measure,

        getStartDate: () => startDate,
        setStartDate: setStartDate,

        getSizeOfAverage: () => sizeOfAverage,
        setSizeOfAverage: setSizeOfAverage,

        forEachToggle: forEachToggle,
        getToggle: getToggle,
        setToggle: setToggle,

        fetchData: fetchData,
        massageData: massageData,
        setupCategories: setupCategories,
        getCategories: () => categories,
        selectionUp: () => {
            function up(array, element) {
                if (!array || array.length === 0) {
                    return undefined;
                }
                if (!element) {
                    // take last
                    return array[array.length - 1].name;
                }
                let index = _.findIndex(array, a => a.name === element);
                if (array[index].name !== element) {
                    return;
                }
                if (0 < index) {
                    return array[index - 1].name;
                }
                return undefined;
            }
            const oldSel = countriesHolder.getSelectedCountry();
            const newSel = up(lasts, oldSel);
            if (oldSel !== newSel) {
                countriesHolder.setSelectedCountry(newSel);
                return newSel;
            }
            return undefined;
        },
        selectionDown: () => {
            function down(array, element) {
                if (!array || array.length === 0) {
                    return undefined;
                }
                if (!element) {
                    // take first
                    return array[0].name;
                }
                let index = _.findIndex(array, a => a.name === element);
                if (array[index].name !== element) {
                    return;
                }
                if (index < array.length - 1) {
                    return array[index + 1].name;
                }
                return undefined;
            }
            const oldSel = countriesHolder.getSelectedCountry();
            const newSel = down(lasts, oldSel);
            if (oldSel !== newSel) {
                countriesHolder.setSelectedCountry(newSel);
                return newSel;
            }
            return undefined;
        },
        getFetchResults: () => massagedData,

        printHeaderTemplateObjects: {
            measure: measure.getType(),
            sizeOfAverage: sizeOfAverage,
            toggleCapita: getToggle("toggleCapita"),
            toggleCumula: getToggle("toggleCumula"),
            toggleLinear: getToggle("toggleLinear"),
        }
    }
}
