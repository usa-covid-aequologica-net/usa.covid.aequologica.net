'use strict';

const data = {};
export const window = {
  _localStorage: {
    setItem: function (id, val) { return data[id] = String(val); },
    getItem: function (id) { return data.hasOwnProperty(id) ? data[id] : undefined; },
    removeItem: function (id) { return delete data[id]; },
    clear: function () { return data = {}; }
  }
};
