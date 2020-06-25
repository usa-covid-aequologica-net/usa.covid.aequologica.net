'use strict';

import { init as initCountryPicker } from './view/countryPicker.js';
import { draw as drawChart } from './view/drawSVG.js';
import { Legend } from './view/legend.js';
import { init as initModel } from './model/data.js';
import { parseParams } from './model/queryStringParser.js';
import { buildPermalink } from './model/permalink.js';

if (location.protocol !== 'https:' && window.location.hostname !== "localhost") {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var errorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
jQuery.Deferred.exceptionHook = function (error, stack) {
    if (error && errorNames.test(error.name)) {
        window.console.warn(
            "jQuery.Deferred exception: " + error.message,
            error.stack,
            stack
        );
        alert(error.message + " " + error.stack + " " + stack);
    }
};

// first thing to do is to decrypt parameters from url
const params = (function () {
    const printMarker = "action=PRINT&";
    let PRINT = false;
    let queryString = window.location.search.substring(1);
    {
        if (queryString && queryString.startsWith(printMarker)) {
            PRINT = true;
            queryString = queryString.substring(printMarker.length);
        }
    }
    return {
        printMarker: printMarker,
        PRINT: PRINT,
        queryString: parseParams(queryString)
    };
})();

// let's go
$(document).ready(() => {

    (function anonymous() { // should take care of not putting things in the global scope, shouldn't it ?

        // model
        const model = initModel(params.queryString);

        // usine à gaz pour dessiner les graphes
        function redraw(countries, doNotAnimate) {

            // raz
            const d3svgChart = d3.select("main svg#chart");
            if (d3svgChart.empty()) {
                return undefined;
            }
            d3svgChart.selectAll("g#rootG").remove();
            const svg = d3svgChart.append("g").attr("id", "rootG");

            // data massage
            if (countries) {
                model.massageData();
            }
            const categories = model.setupCategories();

            // d3
            drawChart(
                svg,
                {
                    isLogarithmic: model.getToggle("toggleLinear") === "logarithmic",
                    isTotal: model.getToggle("toggleCumula") === "total",
                    isPercapita: model.getToggle("toggleCapita") === "percapita",
                    sizeOfAverage: model.getSizeOfAverage(),
                    countries: model.getCountriesHolder().get(),
                    selectedCountry: model.getCountriesHolder().getSelectedCountry(),
                },
                categories,
                params.PRINT,
                doNotAnimate);

            // legend
            Legend().draw(
                model,
                legendTemplate,
                (c) => {
                    redraw(c, true);
                }
            );

        }

        // start date
        {
            const startDate = model.getStartDate();
            $('#startFeedback').text(startDate.format('LL'));
            $('#startRangeInput').prop('value', startDate.dayOfYear());

            $('#startRangeInput').on('change', (e) => {
                model.setStartDate(moment().dayOfYear($.prop(e.currentTarget, 'valueAsNumber')));
                redraw();
            }).on('input', (e) => {
                $('#startFeedback').text(moment().dayOfYear($.prop(e.currentTarget, 'valueAsNumber')).format('LL'));
            });
        }

        // various toggles
        model.forEachToggle((key, val) => {
            $('[data-toggle="toggle"]#' + key).each((i, btn) => {
                const setOn = model.getToggle(key) === $(btn).data('taggle-on');
                $(btn).bootstrapToggle(setOn ? 'on' : 'off');
                $('label#' + key + ', img#' + key).css('opacity', setOn ? "1" : ".666");
            });
        });

        $('#bottom [type="radio"], #bottom [type="checkbox"]').change(event => {
            // which toggle 
            const key = event.currentTarget.id;
            const isChecked = event.currentTarget.checked;
            const oldVal = model.getToggle(key);
            const newVal = isChecked ? $(event.currentTarget).data('taggle-on') : $(event.currentTarget).data('taggle-off');
            if (oldVal !== newVal) {
                model.setToggle(key, newVal);
                $('label#' + key + ', img#' + key).css('opacity', isChecked ? "1" : ".666");
                redraw();
            }
        });

        // cumula
        {
            const cumulat = model.getToggle("toggleCumula");
            $("#cumulat").html(cumulat);
            $('#cumulaGroup .dropdown-toggle').dropdown();
            function cumula2averageFeedback(disable) {
                $('[type="range"]#sizeOfAverage').prop("disabled", disable);
                $('label#bubble, label#average').css({ opacity: !disable ? 1 : .333 });
            }
            cumula2averageFeedback(cumulat === "total");
            $("#cumulaGroup .dropdown-item").on("click", (e) => {
                const odlCumula = model.getToggle("toggleCumula");
                const newCumula = $(e.currentTarget).data("type");
                if (odlCumula !== newCumula) {
                    model.setToggle("toggleCumula", newCumula);
                    $("#cumulat").html(newCumula);
                    cumula2averageFeedback(newCumula === "total");
                    redraw();
                }
            });
        }

        // measure
        {
            const measure = model.getMeasure();
            $("#measure").html(measure.getType());
            $('#mesureGroup .dropdown-toggle').dropdown();
            function measure2deathsFeedback(enable) {
                $('[data-toggle="toggle"]#toggleDeaths').bootstrapToggle(enable ? 'enable' : 'disable');
                $('label#toggleDeaths, img#toggleDeaths').css({ opacity: enable ? 1 : .333 });
            }
            measure2deathsFeedback(measure.getType() !== "deaths");
            $("#mesureGroup .dropdown-item").on("click", (e) => {
                const odlMeasure = measure.getType();
                const newMeasure = $(e.currentTarget).data("type");
                if (odlMeasure != newMeasure) {
                    measure.setType(newMeasure);
                    $("#measure").html(newMeasure);
                    measure2deathsFeedback(measure.getType() !== "deaths");
                    redraw();
                }
            });
        }

        // countries
        {
            const countries = model.getCountriesHolder().get();

            // country picker
            {
                let countryPicker = undefined;
                $("#modalCountryPicker")
                    .on('show.bs.modal', () => {
                        if (!countryPicker) {
                            countryPicker = initCountryPicker(
                                model.getCountriesHolder(),
                                "#modalCountryPicker table",
                            );
                        }
                        countryPicker.beforeOpen();
                    })
                    .on('hidden.bs.modal', () => {
                        const dirty = countryPicker.afterClose();
                        if (dirty) {
                            redraw(model.getCountriesHolder().get());
                        }
                    });
            }
        }

        // size of average
        {
            const sizeOfAverage = model.getSizeOfAverage();
            $("#sizeOfAverage").val(sizeOfAverage);
            $("#bubble").html(sizeOfAverage);
            function averageFeedback(a) {
                $("label#average").html(a < 2
                    ? "day<span style='text-decoration: line-through'>s&nbsp;average</span>"
                    : "day<span>s&nbsp;average</span>"
                );
            }
            averageFeedback(sizeOfAverage);
            const ranges = document.querySelectorAll('#sizeOfAverage[type="range"]');
            if (ranges) {
                ranges.forEach((r) => {
                    r.addEventListener("input", () => {
                        bubble.innerHTML = r.value;
                        averageFeedback(r.value);
                    });
                    r.addEventListener("change", () => {
                        bubble.innerHTML = r.value;
                        if (model.getSizeOfAverage() != r.value) {
                            model.setSizeOfAverage(r.value);
                            averageFeedback(r.value);
                            redraw();
                        }
                    });
                });
            }
        }

        // permalink
        $('#permalinkModal').on('show.bs.modal', () => {
            buildPermalink(model).then(permalink => {
                if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
                    $('#permalinkModal').find('input').val(permalink);
                    $('#permalinkModal').find('label').html("focus, then ctrl-A, ctrl-C to copy permalink to clipboard");
                } else {
                    navigator.clipboard.writeText(permalink);
                    $('#permalinkModal').find('input').remove();
                    $('#permalinkModal').find('label').text("permalink copied to clipboard!");
                }
            });
        }).on('hidden.bs.modal', () => {
        });

        // facebook
        $("#facebook").on("click", function () {
            buildPermalink(model).then(permalink => {
                FB.ui({
                    method: 'share',
                    href: permalink,
                    display: 'popup',
                    quote: permalink,
                    hashtag: "#COVID19"
                }, function (response) { });
            });
        });

        // location
        {
            const $location = $("header #location");
            {
                const countryCode = $("header #location").data("country-code");
                const country = model.getCountriesHolder().code2name(countryCode);
                $("header #location").data("country", country);
            }
            $("header #location").on('click', e => {
                const country = $("header #location").data("country");
                const countries = model.getCountriesHolder().get();
                const oldSelectedCountry = model.getCountriesHolder().getSelectedCountry();
                let doRedraw = false;
                if (!countries.includes(country)) {
                    doRedraw = true;
                    const clone = _.cloneDeep(countries);
                    clone.push(country);
                    model.getCountriesHolder().write(clone);
                }
                const newSelectedCountry = model.getCountriesHolder().toggleSelectedCountry(country);
                if (doRedraw || oldSelectedCountry !== newSelectedCountry) {
                    redraw(model.getCountriesHolder().get());
                }
            });
        }
        // get the data
        {
            model.fetchData(result => {

                $("#end").html(result.latest.format('LL'));
                $('#startRangeInput').prop("max", result.latest.dayOfYear()-2);
                $('#startRangeInput').prop("min", result.earliest.dayOfYear()-1);

                redraw();

                const $printModal = $('.modal#printModal');

                /*
                setupShare(
                    params.PRINT,
                    model,
                    {
                        $printModal: $printModal,
                        $iframeWrapper: $printModal.find('#iframeWrapper'),
                        $counter: $printModal.find('#counter'),
                        $sendButton: $printModal.find('#send'),
                    },
                    buildPermalink,
                    params.printMarker,
                );
                */

            });
        }
    })();

}); // $(document).ready
