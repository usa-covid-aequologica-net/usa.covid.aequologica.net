"use strict";

import { domain } from "./domain.js";
import { populationByCountry } from "./population.js";

export function Fuzzy2Country() {
  /*
  false : no data for country
  true: country name not in list verbatim, fuse.js does find it
  "alternate name": country name not in list, fuse.js unable to find it, force name
  */

  const exceptionsByCountry = {
    world: {
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
    },
    usa: {},
  };

  const valid = () => _.keys(_.pickBy(exceptionsByCountry[domain], (v) => v));

  const options = {
    includeScore: true,
  };

  const countries = _.map(populationByCountry[domain], "name");
  const addendum = valid();
  const countriesExt = _.sortBy([...countries, ...addendum]);

  const fuse = new Fuse(countries, options);

  function convert(param) {
    if (Array.isArray(param)) {
      return _.map(param, (countray) => {
        return convert(countray);
      });
    } else {
      let searchString = param;

      // handle exceptions
      let e = exceptionsByCountry[param];
      if (typeof e !== "undefined") {
        if (typeof e === "boolean") {
          if (!e) {
            return undefined;
          }
        } else if (typeof e === "string") {
          searchString = e;
        }
      }

      const proposals = fuse.search(searchString);
      if (proposals && proposals.length > 0) {
        return proposals[0].item;
      }
      return null;
    }
  }

  return {
    convert: convert,
    countries: countriesExt,
  };
}
