'use strict';

export const factory = {
    world: _.sortedUniq(_.sortBy([
        'Australia',
        'Brazil',
        'France',
        'Germany',
        'Greece',
        'India',
        'Italy',
        'Mexico',
        'United Kingdom',
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
    ]))
};
