"use strict";

import { domain } from "./domain.js";
import { populationByCountry } from "./population.js";

export function Fuzzy2Country() {
  const exceptions = {
    "North Korea": false,
    Turkmenistan: false,
    Yugoslavia: false,
    "Antigua & Barbuda": true,
    "Czech Republic": true,
    "East Timor": true,
    Macedonia: true,
    "St. Kitts and Nevis": true,
    "St. Lucia": true,
    "St. Vincent and the Grenadines": true,
    "United States of America": true,
    "Democratic Republic of the Congo": "DR Congo",
    "Ivory Coast": "Côte d'Ivoire",
    Myanmar: "Burma",
    "Russian Federation": "Russia",
    Swaziland: "Eswatini",
  };
  const valid = () => _.keys(_.pickBy(exceptions, (v) => v));
  const invalid = () => _.keys(_.pickBy(exceptions, (v) => !v));

  const options = {
    includeScore: true,
  };

  const countries = _.map(populationByCountry[domain], "name");
  const addendum = valid();
  const countriesExt = _.sortBy([...countries, ...addendum]);

  const fuse = new Fuse(_.map(populationByCountry[domain], "name"), options);

  function convert(param) {
    if (Array.isArray(param)) {
      return _.map(array, (countray) => {
        return convert(countray);
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
    countries: countriesExt,
  };
}
