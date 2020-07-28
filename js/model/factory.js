'use strict';

export const factory = {
    world: _.sortedUniq(_.sortBy([
        'Argentina',
        'Brazil',
        'Colombia',
        'European Union',
        'India',
        'Mexico',
        'Peru',
        'Russia',
        'South Africa',
        'United States',
    ])),
    usa: _.sortedUniq(_.sortBy([
        'Alabama',
        'Arizona',
        'Arkansas',
        'Florida',
        'Georgia',
        'Iowa',
        'Louisiana',
        'Mississippi',
        'North Carolina',
        'South Carolina',
        'Texas',
        'Utah',
    ])),
    eu: _.sortedUniq(_.sortBy([
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
    ]))
};

