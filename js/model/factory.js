"use strict";

export const factory = {
  world: _.sortedUniq(
    _.sortBy([
      "Argentina",
      "Brazil",
      "Colombia",
      "European Union",
      "France",
      "Germany",
      "India",
      "Iran",
      "Turkey",
      "United States",
    ])
  ),
  usa: _.sortedUniq(
    _.sortBy([
      "Alabama",
      "Arizona",
      "Arkansas",
      "California",
      "Delaware",
      "Oklahoma",
      "Rhode Island",
      "Tennessee",
      "Utah",
      "West Virginia",
    ])
  ),
  eu: _.sortedUniq(
    _.sortBy([
      "Austria",
      "Belgium",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czech Republic (Czechia)",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Ireland",
      "Italy",
      "Latvia",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Netherlands",
      "Poland",
      "Portugal",
      "Romania",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
    ])
  ),
};
