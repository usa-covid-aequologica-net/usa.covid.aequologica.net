'use strict';

import { domain } from './domain.js';
import { store } from './yetAnotherLocalStorageWrapper.js';
import { factory } from './factory.js'
import { populationByCountry } from './population.js';

function code2name(c) {
    if (!c) {
        return c;
    }
    if (c.length === 2) {
        // country code
        const c2 = _.find(populationByCountry[domain], (country) => c === country.code);
        if (c2 && c2.name) {
            return c2.name
        }
    }
    return c;
}

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
        selectedCountry = code2name(c);
        if (!nosave) {
            store.set('selectedCountry', selectedCountry);
        }
    }
}

function getCountryObject(country) {
    const countray = _.find(populationByCountry[domain], { 'name': country });
    if (!countray) {
        console.log("country not found in populationByCountry!", domain, country);
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
    let countrays = store.get('countries', factory[domain].join(","));
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
        code2name: code2name,
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
            
            s = code2name(s);
            
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
        getAsObject: getCountryObject,
        getAsMap: getCountryObjectMap,
        getAsArray: getCountryObjectArray,
        set: countrays => {
            countries = _.sortedUniq(_.sortBy(countrays));
            return countries;
        },
        read: read,
        write: countrays => {
            countrays = _.sortedUniq(_.sortBy(countrays));
            if (_.isEqual(countrays, factory[domain])) {
                store.remove('countries');
            } else {
                store.set('countries', countrays);
            }
            countries = countrays;
            return countries;
        }
    };
}
