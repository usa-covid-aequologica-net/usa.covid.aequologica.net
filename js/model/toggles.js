'use strict';

import { store } from './yetAnotherLocalStorageWrapper.js';

const validToggles = { // first is default
    toggleCapita: ["absolute", "percapita"],
    toggleCumula: ["daily", "total"],
    toggleDeaths: ["hidden", "visible"],
    toggleLinear: ["linear", "logarithmic"],
    toggleLegend: ["unfolded", "folded"],
    togglePopulationColumnVisibility: ["hidden", "visible"],
}

const toggles = {
}

export const readToggles = () => {
    _.each(validToggles, (val, key) => {
        const tmp = store.get(key, val[0]);
        if (tmp && validToggles[key].includes(tmp)) {
            toggles[key] = tmp;
        } else {
            toggles[key] = val[0];
            console.log("invalid value " + key + " = " + tmp + " from local storage; used " + val[0] + "from defaults");
        }
    });
}

export const getDefaultToggle = (key) => {
    if (typeof validToggles[key] === "undefined") {
        throw "not a toggle (" + key + ") !";
    }
    return validToggles[key][0];
};

export const getToggle = (key) => {
    if (typeof validToggles[key] === "undefined") {
        throw "not a toggle (" + key + ") !";
    }
    return toggles[key] || validToggles[key][0];
};

export const setToggle = (key, value, nosave) => {
    if (typeof validToggles[key] === "undefined") {
        throw "not a toggle (" + key + ") !";
    }
    if (toggles[key] !== value) {
        if (!nosave) {
            if (validToggles[key][0] === value) {
                store.remove(key);
            } else {
                store.set(key, value);
            }
        }
        toggles[key] = value;
    }
};

export const forEachToggle = (callback) => {
    _.each(toggles, (val, key) => callback(key, val));
};

