'use strict';

const validToggles = { // first is default
    toggleCapita: ["absolute", "percapita"],
    toggleCumula: ["daily", "total"],
    toggleDeaths: ["hidden", "visible"],
    toggleLinear: ["linear", "logarithmic"],
    togglePoints: ["hidepoints", "showpoints"],
    toggleLegend: ["unfolded", "folded"],
    togglePopulationColumnVisibility: ["hidden", "visible"],
}

const toggles = {
}

export const readToggles = () => {
    _.each(validToggles, (val, key) => {
        const tmp = window._localStorage.getItem(key);
        if (tmp && validToggles[key].includes(tmp)) {
            toggles[key] = tmp;
            console.log(key + " = " + tmp + " from local storage");
        } else {
            toggles[key] = val[0];
            console.log(key + " = " + val[0] + " from defaults");
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
        if (validToggles[key][0] === value) {
            if (!nosave) { window._localStorage.removeItem(key); }
            console.log("remove " + key + "from local storage");
        } else {
            if (!nosave) { window._localStorage.setItem(key, value); }
            console.log("write " + key + " = " + value + " to local storage");
        }
        toggles[key] = value;
    }
};

export const forEachToggle = (callback) => {
    _.each(toggles, (val, key) => callback(key, val));
};

