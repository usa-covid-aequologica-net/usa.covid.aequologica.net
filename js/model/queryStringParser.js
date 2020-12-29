'use strict';

import { domain } from './domain.js';
import { populationByCountry } from './population.js';

export function parseParams(...args) {
    const [input] = args;
    const decoded = decodeURIComponent(input);
    const queryStringParams = {};

    let countries = [];
    let addCountries = false;
    let warnings = {};
    function warn(key, warning) {
        let w = warnings[key] || [];
        w.push(warning);
        warnings[key] = w;
    }
    const array = decoded.split(",");
    function found() {
        array.splice(i, 1);
    }
    let i = array.length;
    while (i--) {
        const item = array[i].trim();
        if (item.length === 0 || item === "_") {
            continue;
        }
        const ITEM = item.toUpperCase();
        const arrayLength = array.length;
        switch (ITEM) {
            case "RESET":
                found();
                queryStringParams.reset = true;
                break;
            case "!":
                found();
                queryStringParams.store = true;
                break;
            case "CONFIRMED":
                found();
                queryStringParams.measure = "confirmed";
                break;
            case "DEATHS":
                found();
                queryStringParams.measure = "deaths";
                break;
            /* case "RECOVERED":
                found();
                queryStringParams.measure = "recovered";
                break; */
            case "LIN":
            case "LINEAR":
                found();
                queryStringParams.toggleLinear = "linear";
                break;
            case "LOG":
            case "LOGARITHMIC":
                found();
                queryStringParams.toggleLinear = "logarithmic";
                break;
            case "ABS":
            case "ABSOLUTE":
                found();
                queryStringParams.toggleCapita = "absolute";
                break;
            case "PER":
            case "PERCAPITA":
                found();
                queryStringParams.toggleCapita = "percapita";
                break;
            case "TOT":
            case "TOTAL":
                found();
                queryStringParams.toggleCumula = "total";
                break;
            case "DAY":
            case "DAILY":
                found();
                queryStringParams.toggleCumula = "daily";
                break;
            default:
                warn(item, 'not a reserved word');
                // country code ?
                if (ITEM.match("^\\+?[A-Z]{2}\\*?$")) {
                    let countryCode = ITEM;
                    let isSelected = false;
                    addCountries = false; // last one wins
                    if (ITEM.length >= 3) {
                        if (ITEM.charAt(0) === "+") {
                            countryCode = ITEM.substring(1, 3);
                            addCountries = true;
                        }
                        if (ITEM.charAt(ITEM.length - 1) === "*" || ITEM.charAt(0) === "*") {
                            countryCode = ITEM.substring(ITEM.length - 3, ITEM.length - 1);
                            isSelected = true;
                        }
                    }
                    const candidate = _.find(populationByCountry[domain], (country) => countryCode === country.code);
                    if (candidate) {
                        found();
                        if (isSelected) {
                            queryStringParams.selectedCountry = candidate.name;
                        }
                        countries.push(candidate);
                        break;
                    } else {
                        warn(countryCode, isSelected, 'country code not found');
                    }
                } else {
                    warn(item, 'not a country code');
                }
                // integer between 1 and 28 ?
                if (ITEM.match("^\\d+$")) {
                    const itemAsInteger = +ITEM;
                    if (Number.isInteger(itemAsInteger)) {
                        if (0 < itemAsInteger && itemAsInteger <= 28) {
                            found();
                            queryStringParams.sizeOfAverage = itemAsInteger;
                            break;
                        } else {
                            warn(item, 'integer is not between 1 and 28 (incl.)');
                        }
                    } else {
                        warn(item, 'not an integer');
                    }
                } else {
                    warn(item, 'not a number');
                }
                // date ?
                if (item.match("^[\\d]{2,4}[\\s\\-\\_\\/][\\d]{1,2}[\\s\\-\\_\\/][\\d]{1,2}$")) {
                    const date = moment.utc(item, "YYYY MM DD");
                    if (date && date.isValid()) {
                        if (date.isBefore(moment().subtract(2, 'days')) && date.isAfter(moment("2020-01-21"))) {
                            found();
                            queryStringParams.startDate = date;
                            break;
                        } else {
                            warn(item, 'date is not between 2020-01-21 and the day before yesterday');
                        }
                    } else {
                        warn(item, 'not a valid date');
                    }
                } else {
                    warn(item, 'not a date in format YYYY-DD-MM');
                }
                // basta
                break;
        }
        if (arrayLength - 1 == array.length) {
            delete warnings[item];
        }
    }

    if (countries.length > 0) {
        queryStringParams.countries = _.sortedUniq(_.sortBy(_.map(countries, 'name')));
    }

    if (addCountries) {
        queryStringParams.addCountries = addCountries;
    }

    if (!_.isEmpty(warnings)) {
        console.log("these could not be parsed", warnings);
    }

    console.log("query string params", queryStringParams);

    return queryStringParams;

}

