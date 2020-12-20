'use strict';

let _localStorage;
(function (hasLocalStorage) {
    if (hasLocalStorage) {
        _localStorage = window.localStorage;
    } else {
        var data = {};
        _localStorage = {
            setItem: function (id, val) { return data[id] = String(val); },
            getItem: function (id) { return data.hasOwnProperty(id) ? data[id] : undefined; },
            removeItem: function (id) { return delete data[id]; },
            clear: function () { return data = {}; }
        };
    }
})((function () {
    try {
        return "localStorage" in window && window.localStorage != null;
    } catch (e) {
        return false;
    }
})());

export const store = {
    set: (key, value) => {
        _localStorage.setItem(key, value);
        console.log("write /" + key + "/ = '" + value + "' to local storage");
    },
    get: (key, alt) => {
        let value = _localStorage.getItem(key);
        if (typeof value === 'undefined' || value == null) {
            console.log("get /" + key + "/ = '" + alt + "' from defaults");
            return alt;
        } else {
            console.log("read /" + key + "/ = '" + value + "' from local storage");
            return value;
        }
    },
    clear: () => {
        _localStorage.clear();
        console.log("removed EVERYTHING from local storage");
    },
    remove: (key) => {
        _localStorage.removeItem(key);
        console.log("removed /" + key + "/ from local storage");
    },
};