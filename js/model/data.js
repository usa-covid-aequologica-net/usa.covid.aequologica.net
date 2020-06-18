'use strict';

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
function calcMovingAverage(data, lasts, country) {
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
    // recalc sort order for selection up/down
    const last = _.find(lasts, l => l.name === country);
    if (last) {
        const newLast = data[country][data[country].length-2].deltaMovingAverage;
        const oldLast = last.deltaMovingAverage;
        if (!_.isEqual(oldLast,newLast)) {
            last.deltaMovingAverage = newLast;
        }
    }
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
            if (massagedData && massagedData.data && massagedData.lasts) {
                calcMovingAverage(massagedData.data, massagedData.lasts, country);
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
        storedSizeOfAverage = parseInt(storedSizeOfAverage, 10);  // "Always specify a radix to avoid (...) unreliable behavior" https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt
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

    let end = moment();
    let latest = new moment(end);
    let earliest = moment();

    // compute delta
    if (countries.length > 0) {
        end = moment(_.maxBy(data[countries[0]], 'date').date);
        latest = new moment(end);
        earliest = moment(_.minBy(data[countries[0]], 'date').date);
        latest.subtract(2, 'days');
        earliest.subtract(1, 'days');

        countries.forEach((country) => {
            if (data[country].done) {
                return;
            }

            let previousMeasure = _.clone(measure.typesObject);
            if (!data[country]) {
                console.log(country, "OUILLEE, no data !?");
            } else {

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
    }

    // store last measures in 'lasts' to be able to sort later
    let lasts = [];
    {
        const sort = [];
        lasts = _.transform(data, (result, value, key) => (result.push({
            name: key,
            total: value[value.length - 1].total,
            delta: value[value.length - 1].delta,
            deltaMovingAverage: value[value.length - 1].deltaMovingAverage,
        })), []);
    }

    countries.forEach((country) => {
        calcMovingAverage(data, lasts, country);
    });

    massagedData.data = data;
    massagedData.lasts = lasts;
    massagedData.end = end;
    massagedData.latest = latest;
    massagedData.earliest = earliest;

    return massagedData;
}

// Read in data
function fetchData(callback) {
    d3.json("https://pomber.github.io/covid19/timeseries.json").then((data) => {

        rawData = data;
        massagedData = {
            data: undefined,
            end: undefined,
            latest: undefined,
            earliest: undefined,
        };

        massageData();

        setSizeOfAverage(sizeOfAverage, true);

        return callback(massagedData);
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
        selectionUp: () => {
            function up(array, element) {
                if (!element) {
                    return;
                }
                let index = _.findIndex(array, a => a.name === element);
                if (array[index].name !== element) {
                    return;
                }
                if (0 < index) {
                    return array[index - 1].name;
                }
                return;
            }
            const oldSel = countriesHolder.getSelectedCountry();
            const newSel = up(massagedData.lasts, oldSel);
            if (newSel && oldSel !== newSel) {
                countriesHolder.setSelectedCountry(newSel);
                return newSel;
            }
            return;
        },
        selectionDown: () => {
            function down(array, element) {
                if (!element) {
                    return;
                }
                let index = _.findIndex(array, a => a.name === element);
                if (array[index].name !== element) {
                    return;
                }
                if (index < array.length - 1) {
                    return array[index + 1].name;
                }
            }
            const oldSel = countriesHolder.getSelectedCountry();
            const newSel = down(massagedData.lasts, oldSel);
            if (newSel && oldSel !== newSel) {
                countriesHolder.setSelectedCountry(newSel);
                return newSel;
            }
            return;
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
