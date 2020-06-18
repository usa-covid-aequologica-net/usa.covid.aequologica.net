'use strict';

import { store } from './yetAnotherLocalStorageWrapper.js';
// import { factory } from './factory.js'
const factory = _.sortedUniq(_.sortBy([
    "Brazil",
    "Chile",
    "India",
    "Iran",
    "Mexico",
    "Pakistan",
    "Peru",
    "Russia",
    "United Kingdom",
    "United States",
]));
import { populationByCountry } from './population.js';

function reset() {
    store.remove('countries');
    countries = _.clone(factory);
    return countries;
};

function getSelectedCountry() {
    if (countries.includes(selectedCountry)) {
        return selectedCountry;
    }
    return undefined;
}

function setSelectedCountry(c, nosave) {
    if (!c) {
        selectedCountry = undefined;
        if (!nosave) {
            store.remove('selectedCountry');
        }
    } else {
        selectedCountry = c;
        if (!nosave) {
            store.set('selectedCountry', selectedCountry);
        }
    }
}

function getCountryObject(country) {
    const countray = _.find(populationByCountry, { 'name': country });
    if (!countray) {
        console.log("country not found in populationByCountry!", country);
        return { name: country, count: 1, code: "XX" };
    }
    return countray;
}

function getCountryObjectArray() {
    let array = [];
    countries.forEach((country) => {
        array.push(getCountryObject(country));
    });
    return array;
}

function getCountryObjectMap() {
    let map = {};
    countries.forEach((country) => {
        map[country] = getCountryObject(country);
    });
    return map;
}

function read() {
    let countrays = store.get('countries', factory.join(","));
    if (typeof countrays !== "string" || countrays.length == 0) {
        countrays = [];
    } else {
        countrays = countrays.split(',');
    }
    countries = _.sortedUniq(_.sortBy(countrays));
    return countries;
}

let countries = undefined;
read();

let selectedCountry = store.get('selectedCountry', undefined);

export function Countries() {
    return {
        getSelectedCountry: getSelectedCountry,
        setSelectedCountry: setSelectedCountry,
        isSelected: s => countries.includes(s) && selectedCountry === s,
        selectedCountryDown: () => {
            if (!selectedCountry) {
                return;
            }
            let index = _.sortedIndexBy(countries, selectedCountry);
            if (countries[index] !== selectedCountry) {
                return;
            }
            if (index < countries.length - 1) {
                setSelectedCountry(countries[index + 1]);
            }
            return selectedCountry;
        },
        selectedCountryUp: () => {
            if (!selectedCountry) {
                return;
            }
            let index = _.sortedIndexBy(countries, selectedCountry);
            if (countries[index] !== selectedCountry) {
                return;
            }
            if (0 < index) {
                setSelectedCountry(countries[index - 1]);
            }
            return selectedCountry;
        },
        toggleSelectedCountry: s => {
            if (!s) {
                return undefined;
            }
            if (!countries.includes(s)) {
                return undefined;
            }
            if (s === selectedCountry) {
                setSelectedCountry(undefined);
            } else {
                setSelectedCountry(s);
            }
            return selectedCountry;
        },
        get: () => countries,
        getAsMap: getCountryObjectMap,
        getAsArray: getCountryObjectArray,
        set: countrays => {
            countries = _.sortedUniq(_.sortBy(countrays));
            return countries;
        },
        reset: reset,
        read: read,
        write: countrays => {
            countrays = _.sortedUniq(_.sortBy(countrays));
            if (_.isEqual(countrays, factory)) {
                return reset();
            } else {
                store.set('countries', countrays);
            }
            countries = countrays;
            return countries;
        }
    };
}
