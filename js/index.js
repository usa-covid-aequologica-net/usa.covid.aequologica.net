'use strict';

import { init as initCountryPicker } from './view/countryPicker.js';
import { draw as drawChart } from './view/drawSVG.js';
import { Legend } from './view/legend.js';
import { init as initModel } from './model/data.js';
import { parseParams } from './model/queryStringParser.js';
import { buildPermalink } from './model/permalink.js';
import { store } from './model/yetAnotherLocalStorageWrapper.js';
import { Carousel } from './model/carousel.js';
import { populationByCountry } from './model/population.js';
import { domain } from './model/domain.js';
import { factory } from './model/factory.js'
import { Fuzzy2Country } from './js/model/fuzzy.js';

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

        // speech
        window.ps.subscribe('COMMAND', async (e) => {
            if (!e) return;
            
            // {
            //     async function sleep(ms) {
            //         return new Promise(resolve => setTimeout(resolve, ms));
            //     }
            //     console.log(new Date());
            //     await sleep(5000);
            //     console.log(new Date());
            // }
            const fuzzy2country =  Fuzzy2Country().convert(key);
            if (e.action == 'RESET') {
                model.getCountriesHolder().write(factory[domain]);
                redraw(model.getCountriesHolder().get());
                return;
            } 
            if (e.action == 'CLEAR') {
                model.getCountriesHolder().write([]);
                redraw(model.getCountriesHolder().get());
                return;
            } 
            if (e.action == "SELECT") {
                model.getCountriesHolder().setSelectedCountry(fuse.search(e.argument));
                window.ps.publish('KEYBOARD', { event: 'SPACE' });
                return;
            } 
            // https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848
            if (e.action == "ADD" || e.action == "PLUS" || e.action == "+") {
                let union = [];
                if (Array.isArray(e.argument)) { // array of countries
                    union = [fuzzy2country.convert(...e.argument), ...model.getCountriesHolder().get()];
                } else if (typeof e.argument === "string" && e.argument === "ALL") { // ALL
                    union = _.map(populationByCountry[domain], "name");
                } 
                model.getCountriesHolder().write(union);
                redraw(model.getCountriesHolder().get());
                return;
            } 
            if (e.action == "REMOVE" || e.action == "MINUS" || e.action == "-") {
                let difference = [];
                if (Array.isArray(e.argument)) { // array of countries
                    const squared = fuzzy2country.convert(e.argument);
                    difference = model.getCountriesHolder().get().filter(x => !squared.includes(x));
                } else if (typeof e.argument === "string" && e.argument === "ALL") { // ALL
                    ;
                } 
                model.getCountriesHolder().write(difference);
                redraw(model.getCountriesHolder().get());
                return;
            } 
            if (e.action == "SET") {
                let set = [];
                if (Array.isArray(e.argument)) { // array of countries
                    set = fromFuzzyToCountry(e.argument);
                } else if (typeof e.argument === "string" && e.argument === "ALL") { // ALL
                    set = _.map(populationByCountry[domain], "name");
                } 
                model.getCountriesHolder().write(set);
                redraw(model.getCountriesHolder().get());
                return;
            }
        
        });
    
        // start date
        {
            const startDate = model.getStartDate();
            $('#startFeedback > span').text(startDate.format('LL'));
            $('#startRangeInput').prop('value', startDate.dayOfYear());

            $('#startRangeInput').on('change', (e) => {
                model.setStartDate(moment().dayOfYear($.prop(e.currentTarget, 'valueAsNumber')));
                redraw();
            }).on('input', (e) => {
                $('#startFeedback > span').text(moment().dayOfYear($.prop(e.currentTarget, 'valueAsNumber')).format('LL'));
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

        $('footer [type="radio"], footer [type="checkbox"]').change(event => {
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
        function cumula2averageFeedback(disable) {
            $('[type="range"]#sizeOfAverage').prop("disabled", disable);
            $('label#bubble, label#average').css({ opacity: !disable ? 1 : .333 });
        }
        {
            const cumulat = model.getToggle("toggleCumula");
            $("#cumulat").parent().attr("data-color", cumulat);
            $("#cumulat").html(cumulat);
            $('#cumulaGroup .dropdown-toggle').dropdown();
            cumula2averageFeedback(cumulat === "total");
            $("#cumulaGroup .dropdown-item").on("click", (e) => {
                const odlCumula = model.getToggle("toggleCumula");
                const newCumula = $(e.currentTarget).data("type");
                if (odlCumula !== newCumula) {
                    model.setToggle("toggleCumula", newCumula);
                    $("#cumulat").parent().attr("data-color", newCumula);
                    $("#cumulat").html(newCumula);
                    cumula2averageFeedback(newCumula === "total");
                    redraw();
                }
            });
        }

        // measure
        function measure2deathsFeedback(enable) {
            $('[data-toggle="toggle"]#toggleDeaths').bootstrapToggle(enable ? 'enable' : 'disable');
            $('label#toggleDeaths, img#toggleDeaths').css({ opacity: enable ? 1 : .333 });
        }
        {
            const measure = model.getMeasure();
            $("#measure").parent().attr("data-color", measure.getType());
            $("#measure").html(measure.getType());
            $('#mesureGroup .dropdown-toggle').dropdown();
            measure2deathsFeedback(measure.getType() !== "deaths");
            $("#mesureGroup .dropdown-item").on("click", (e) => {
                const oldMeasure = measure.getType();
                const newMeasure = $(e.currentTarget).data("type");
                if (oldMeasure != newMeasure) {
                    measure.setType(newMeasure);
                    $("#measure").parent().attr("data-color", measure.getType());
                    $("#measure").html(newMeasure);
                    measure2deathsFeedback(measure.getType() !== "deaths");
                    redraw();
                }
            });
        }

        // swipe carousel
        {  
            function rightOrLeft (carousel) {            
                const measure = model.getMeasure();
                const oldMeasure = measure.getType();
                const oldCumula = model.getToggle("toggleCumula")

                const news = carousel(oldCumula, oldMeasure);

                const newMeasure = news.measure;
                const newCumula = news.cumula;

                let doRedraw = false;
                if (oldMeasure !== newMeasure) {
                    doRedraw = true;
                    measure.setType(newMeasure);
                    $("#measure").parent().attr("data-color", newMeasure);
                    $("#measure").html(newMeasure);
                    measure2deathsFeedback(measure.getType() !== "deaths");
                }
                if (oldCumula !== newCumula) {
                    doRedraw = true;
                    model.setToggle("toggleCumula", newCumula);
                    $("#cumulat").parent().attr("data-color", newCumula);
                    $("#cumulat").html(newCumula);
                    cumula2averageFeedback(newCumula === "total");
                }
                if (doRedraw) {
                    redraw();
                }
            }

            document.addEventListener('swiped-right', function(e) {
                return rightOrLeft(Carousel().right);
            });

            document.addEventListener('swiped-left', function(e) {
                return rightOrLeft(Carousel().left);
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
                        {
                            const countries_before_filter = store.get("countries_before_filter");
                            if (countries_before_filter) {
                                model.getCountriesHolder().write(countries_before_filter.split(','));
                                store.remove("countries_before_filter");
                            }
                            model.setToggle("toggleFilter", "off");
                            const $filterToggle = $('[type="button"]#filterToggle');
                            $filterToggle.addClass('active').children("img#filter").show();
                            $filterToggle.addClass('active').children("img#eye").hide();
                            $filterToggle.removeClass('active').children("sup").html("10");
                            $filterToggle.attr('title', "top ten filter");
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
            const values = [1,2,3,4,5,6,7,14,21,28];
            const sizeOfAverage = model.getSizeOfAverage();
            if (sizeOfAverage <= 7) { 
                $("#sizeOfAverage").val(sizeOfAverage-1);
            } else if (sizeOfAverage <= 14) { 
                $("#sizeOfAverage").val(7);
            }else if (sizeOfAverage <= 21) { 
                $("#sizeOfAverage").val(8);
            }else if (sizeOfAverage <= 28) { 
                $("#sizeOfAverage").val(9);
            }
            $("#bubble").html(sizeOfAverage);
            function averageFeedback(a) {
                $("label#average").html(a < 2
                    ? "day<span style='text-decoration: line-through; color: #9a9a9a;'>s average</span>"
                    : "day<span>s average</span>"
                );
            }
            averageFeedback(sizeOfAverage);
            const sizeOfAverageRange = document.querySelectorAll('#sizeOfAverage[type="range"]');
            if (sizeOfAverageRange) {
                sizeOfAverageRange.forEach((r) => {
                    r.addEventListener("input", () => {
                        const translated = values[r.value];
                        bubble.innerHTML = translated;
                        averageFeedback(translated);
                    });
                    r.addEventListener("change", () => {
                        const translated = values[r.value];
                        bubble.innerHTML = translated;
                        if (model.getSizeOfAverage() != translated) {
                            model.setSizeOfAverage(translated);
                            averageFeedback(translated);
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
                $('#startRangeInput').prop("max", result.latest.dayOfYear() - 2);
                $('#startRangeInput').prop("min", result.earliest.dayOfYear() - 1);

                redraw();

                const $printModal = $('.modal#printModal');

            });
        }
    })();

}); // $(document).ready
