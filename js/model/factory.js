'use strict';

// the current 10 most affected countries
// as of 2020-06-14
// according to JHU https://coronavirus.jhu.edu/data/new-cases

export const factory = _.sortedUniq(_.sortBy([
    "Australia",
    "Bengladesh",
    "Brazil",
    "France",
    "Germany",
    "India",
    "Italy",
    "Morocco",
    "United Kingdom",
    "United States",
]));



