'use strict';

import { pubSubKey } from './keyboard.js';
import { store } from '../model/yetAnotherLocalStorageWrapper.js';

export function Legend() {
    'use strict';

    // legend
    return {
        draw: (model, handlebarsTemplate, refresh) => {

            const color = d3.scaleOrdinal().range(d3.schemeCategory10);
            // Set the color domain equal to the countries
            const countries = model.getCountriesHolder().get();
            color.domain(countries);

            const isPopulationColumnVisible = model.getToggle("togglePopulationColumnVisibility") === "visible";

            const $legend = $("main #legend table.table");
            $legend.empty();

            Handlebars.registerHelper("color", (country) => 'style="color:' + color(country) + ';"');
            Handlebars.registerHelper("format", (number) => number.toLocaleString());
            Handlebars.registerHelper("lowercase", (text) => text.toLowerCase());
            Handlebars.registerHelper("pop-style", () => 'style="display:' + (isPopulationColumnVisible ? 'table-cell' : 'none') + '"');
            const legendHeadAndBody = handlebarsTemplate(model.getCountriesHolder().getAsArray());
            $legend.html(legendHeadAndBody);

            function feedbackSelectedCountry(selectedCountry, doNotScrollIntoView) {
                // legend
                $('#legend td.country.active').removeClass("active");
                $('#legend tr').removeClass("selected");
                // chart
                $('#chart .category').removeClass('active');
                $('#chart .category').removeClass('inactive');
                // location
                $("header #location").removeClass('active');

                let ret = undefined;
                if (selectedCountry) {
                    // legend
                    const $me = $('#legend td.country[name="' + selectedCountry + '"]');
                    $me.addClass("active");
                    $me.parent().addClass("selected");
                    if (!doNotScrollIntoView) {
                        if ($me && 0 < $me.length) {
                            $me[0].scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                            });
                        }
                    }
                    // chart
                    $('#chart .category').addClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').removeClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').addClass('active');

                    // location
                    const location = $("header #location").data("country");
                    if (selectedCountry === location) {
                        $("header #location").addClass('active');
                    }

                    ret = $me;
                }

                displayFoldedLegend($("#legend table.table tbody").data("folded"));

                window.ps.publish('SELECTED_COUNTRY', selectedCountry);

                return ret;

            }
            const selectedCountry = model.getCountriesHolder().getSelectedCountry();
            feedbackSelectedCountry(selectedCountry);


            const removeButtons = document.querySelectorAll('[type="button"].remove');
            removeButtons.forEach((b) => {
                b.addEventListener("click", (event) => {
                    const countries_before_filter = store.get("countries_before_filter");
                    if (countries_before_filter) {
                        const asArray = countries_before_filter.split(',');
                        if (asArray.length > 0) {
                            const index = asArray.indexOf(event.currentTarget.name);
                            if (index > -1) {
                                asArray.splice(index, 1);
                                store.set("countries_before_filter", asArray);
                            }
                        }
                    }
                    const countries = model.getCountriesHolder().get();
                    const index = countries.indexOf(event.currentTarget.name);
                    if (index > -1) {
                        countries.splice(index, 1);
                    }
                    const countries2 = model.getCountriesHolder().write(countries);
                    refresh(countries2);
                })
            });

            // population columns
            const $populationToggle = $('[type="button"]#populationToggle');
            function feedbackPopulationColumnVisible() {
                const isPopulationColumnVisible = model.getToggle("togglePopulationColumnVisibility") === "visible";
                if (isPopulationColumnVisible) {
                    $populationToggle.addClass('active');
                } else {
                    $populationToggle.removeClass('active');
                }
            }
            feedbackPopulationColumnVisible();
            $populationToggle.on('click', (b) => {
                const pops = document.getElementsByClassName("legend_population");
                for (let pop of pops) {
                    const sty = pop.getAttribute("style");
                    if (!sty || sty == "display:table-cell") {
                        model.setToggle("togglePopulationColumnVisibility", "hidden");
                        pop.setAttribute("style", "display: none");
                    } else {
                        model.setToggle("togglePopulationColumnVisibility", "visible");
                        pop.setAttribute("style", "display:table-cell");
                    }
                }
                feedbackPopulationColumnVisible();
            });

            // filter
            const $filterToggle = $('[type="button"]#filterToggle');
            { 
                const countries = model.getCountriesHolder().get();
                if (countries.length <= 10 && model.getToggle("toggleFilter") === 'off') {
                    // $filterToggle.attr('disabled', 'disabled');
                    $filterToggle.hide();
                } else {
                    // $filterToggle.removeAttr('disabled');
                    $filterToggle.show();
                }
            }
            function feedbackFilter() {
                const toggleFilter = model.getToggle("toggleFilter");
                if (toggleFilter === "on") {
                    $filterToggle.addClass('active').children("img#filter").hide();
                    $filterToggle.addClass('active').children("img#eye").show();
                    $filterToggle.addClass('active').children("sup").html("ALL");
                    $filterToggle.attr('title', "show all");
                } else {
                    $filterToggle.addClass('active').children("img#filter").show();
                    $filterToggle.addClass('active').children("img#eye").hide();
                    $filterToggle.removeClass('active').children("sup").html("10");
                    $filterToggle.attr('title', "top ten filter");
                }
            }
            feedbackFilter();
            $filterToggle.on('click', (b) => {
                const toggleFilter = model.getToggle("toggleFilter");
                if (toggleFilter === "on") {
                    const countries_before_filter = store.get("countries_before_filter");
                    if (countries_before_filter) {
                        model.getCountriesHolder().write(countries_before_filter.split(','));
                        store.remove("countries_before_filter");
                    }
                    model.setToggle("toggleFilter", "off");
                } else {
                    const countries_after_filter = model.topTen();
                    if (countries_after_filter && countries_after_filter.length > 0) {
                        store.set("countries_before_filter", model.getCountriesHolder().get());
                        model.getCountriesHolder().write(countries_after_filter);
                    }
                    model.setToggle("toggleFilter", "on");
                }
                feedbackFilter();
                refresh(model.getCountriesHolder().get());
            });

            $("#legend table.table tbody").on('click', "td.country", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const selectedCountry = model.getCountriesHolder().toggleSelectedCountry($(e.currentTarget).attr('name'));
                feedbackSelectedCountry(selectedCountry, true);
            });

            function displayFoldedLegend(folded) {
                $("#legend table.table tbody").data("folded", folded);
                if (folded) {
                    // hide all rows not selected
                    $("#legend table.table tbody tr:not(.selected)").hide();
                    $("#legend table.table tbody tr.selected").show();
                    $("#legendToggle").addClass("folded").addClass('active');
                } else {
                    // show all rows
                    $("#legend table.table tbody tr").css("display", "table-row");
                    $("#legendToggle").removeClass("folded").removeClass('active');
                }
            }

            // unfold legend when selectedCountry is not in country set
            let folded = model.getToggle("toggleLegend") === "folded";
            if (folded) {
                if (!model.getCountriesHolder().get().includes(selectedCountry)) {
                    model.setToggle("toggleLegend", "unfolded");
                    folded = false;
                }
            }

            displayFoldedLegend(folded);

            $("main #legendToggle").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const $tbody = $("#legend table.table tbody");
                const fold = !$tbody.data("folded");
                $tbody.data("folded", fold);
                model.setToggle("toggleLegend", fold ? "folded" : "unfolded")
                displayFoldedLegend(fold);
            });

            $("main #legendSelectionUp").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const newSelectedCountry = model.selectionUp();
                feedbackSelectedCountry(newSelectedCountry);
            });

            $("main #legendSelectionDown").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const newSelectedCountry = model.selectionDown();
                feedbackSelectedCountry(newSelectedCountry);
            });

            window.ps.subscribe(pubSubKey, (e) => {
                console.log("received " + e.event);
                if (e.event == 'UP') {
                    const newSelectedCountry = model.selectionUp();
                    feedbackSelectedCountry(newSelectedCountry);
                } else if (e.event == 'DOWN'){
                    const newSelectedCountry = model.selectionDown();
                    feedbackSelectedCountry(newSelectedCountry);
                }
            });
        }
    }
}
