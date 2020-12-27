"use strict";

import { domain } from './domain.js';
import { populationByCountry } from './population.js';

export function Fuzzy2Country() {

  const exceptions = {
    "East Timor": true,
    "Turkmenistan": false,
    "Swaziland": "Eswatini",
    "St. Lucia": true,
    "Ivory Coast": "Côte d'Ivoire",
    "United States of America": true,
    "St. Vincent and the Grenadines": true,
    "Antigua & Barbuda": true,
    "Czech Republic": true,
    "St. Kitts and Nevis": true,
    "Democratic Republic of the Congo": "DR Congo",
    "Macedonia": true,
    "North Korea": false,
    "Myanmar": "Burma",
    "Yugoslavia": false,
    "Russian Federation": "Russia",
  };

  const options = {
    includeScore: true,
  };

  const fuse = new Fuse(_.map(populationByCountry[domain], "name"), options);
  
  function convert(param) {
    if (Array.isArray(param)) {
      return _.map(array, (countray) => {
        return fromFuzzyToCountry(countray);
      });
    } else {
      let e = exceptions[param];
      if (typeof e === "undefined") {
        const proposals = fuse.search(param);
        if (proposals && proposals.length > 0) {
          return proposals[0].item;
        }
        return null;
      }
      if (typeof e === "boolean") {
        if (!e) {
          return undefined;
        }
        const proposals = fuse.search(param);
        if (proposals && proposals.length > 0) {
          return proposals[0].item;
        }
        return null;
      }
      if (typeof e === "string") {
        const proposals = fuse.search(e);
        if (proposals && proposals.length > 0) {
          return proposals[0].item;
        }
        return null;
      }
      throw "qwe";
    }
  }

  return {
    convert: convert,
  };
}
