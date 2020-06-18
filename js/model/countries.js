'use strict';

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


let countries = undefined;
let selectedCountry = undefined;

function reset() {
    window._localStorage.removeItem('countries');
    console.log("'remove countries from local storage'");
    countries = _.clone(factory);
    return countries;
};

function setSelectedCountry(c, nosave) {
    if (!c) {
        selectedCountry = undefined;
        if (!nosave) {
            console.log("'remove selected country from local storage'");
            window._localStorage.removeItem('selectedCountry');
        } else {
            console.log("'no country selected'");
        }
    } else {
        selectedCountry = c;
        if (!nosave) {
            console.log("'write selected country to local storage'", selectedCountry);
            window._localStorage.setItem('selectedCountry', selectedCountry);
        } else {
            console.log("'selected country = '" + selectedCountry + ' from local storage');
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


export function Countries() {
    return {
        getSelectedCountry: () => {
            if (countries.includes(selectedCountry)) {
                return selectedCountry;
            }
            return undefined;
        },
        isSelected: s => countries.includes(s) && selectedCountry === s,
        setSelectedCountry: setSelectedCountry,
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
        set: cs => {
            countries = _.sortedUniq(_.sortBy(cs));
            return countries;
        },
        reset: reset,
        read: () => {
            let cs = window._localStorage.getItem('countries');
            if (cs != null) {
                if (typeof cs !== "string" || cs.length == 0) {
                    cs = [];
                } else {
                    cs = cs.split(',');
                }
                console.log("'countries from local storage'", cs);
            } else {
                cs = _.clone(factory);
                console.log("'countries from factory'", cs);
            }
            countries = _.sortedUniq(_.sortBy(cs));
            setSelectedCountry(window._localStorage.getItem('selectedCountry'), true);
            return countries;
        },
        write: cs => {
            cs = _.sortedUniq(_.sortBy(cs));
            if (_.isEqual(cs, factory)) {
                return reset();
            } else {
                window._localStorage.setItem('countries', cs);
                console.log("'write countries to local storage'", cs);

            }
            countries = cs;
            return countries;
        }
    };
}
