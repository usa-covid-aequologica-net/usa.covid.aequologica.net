'use strict';

export function buildPermalink(...args) {
    const [properties] = args;

    return new Promise(function (resolve, reject) {
        let permalink =
            window.location.protocol +
            "//" +
            window.location.hostname +
            (window.location.port ? (":" + window.location.port) : "");
        let options = [];
        {
            options.push(properties.getMeasure().getType());
            if (properties.getToggle("toggleLinear") === "linear") {
                options.push("lin");
            } else {
                options.push("log");
            }
            if (properties.getToggle("toggleCumula") === "total") {
                options.push("tot");
            } else {
                options.push("day");
            }
            if (properties.getToggle("toggleCapita") === "percapita") {
                options.push("per");
            } else {
                options.push("abs");
            }
            options.push("" + properties.getSizeOfAverage());
            options.push(properties.getStartDate().format("YYYY-MM-DD"));
            _.each(properties.getCountriesHolder().getAsMap(), (pop, key) => {
                let cc = pop.code;
                if (key === properties.getCountriesHolder().getSelectedCountry()) {
                    cc = cc + "*";
                }
                options.push(cc);
            });
        }
        options = _.sortedUniq(_.sortBy(options));

        permalink = permalink + options.join(",");

        // patch for horrible facebook querystring mangling
        permalink = permalink + ",_";

        permalink = permalink.replace(/http:\/\/localhost:8001/, "https://covid.aequologica.net");
        permalink = permalink.replace(/http:\/\/localhost:8002/, "https://usa.covid.aequologica.net");
                
        resolve(permalink);
    });
}