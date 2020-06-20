'use strict';

import { pubSubKey } from './keyboard.js';


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

            const $legend = $("main #legend");

            Handlebars.registerHelper("color", (country) => 'style="color:' + color(country) + ';"');
            Handlebars.registerHelper("format", (number) => number.toLocaleString());
            Handlebars.registerHelper("pop-style", () => 'style="display:' + (isPopulationColumnVisible ? 'table-cell' : 'none') + '"');

            $legend.html(handlebarsTemplate(model.getCountriesHolder().getAsArray()));

            function feedbackSelectedCountry(selectedCountry, scrollIntoView) {
                // legend
                $('#legend td.country.active').removeClass("active");
                $('#legend tr').removeClass("selected");
                // chart
                $('#chart .category').removeClass('active');
                $('#chart .category').removeClass('inactive');

                let ret = undefined;
                if (selectedCountry) {
                    // legend
                    const $me = $('#legend td.country[name="' + selectedCountry + '"]');
                    $me.addClass("active");
                    $me.parent().addClass("selected");
                    if (scrollIntoView) {
                        if ($me && 0 < $me.length) {
                            $me[0].scrollIntoView();
                        }
                    }
                    // chart
                    $('#chart .category').addClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').removeClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').addClass('active');
                    
                    ret = $me;
                }

                displayFoldedLegend($("#legend table tbody").data("folded"));

                window.ps.publish('SELECTED_COUNTRY', selectedCountry);

                return ret;
                    
            }
            const selectedCountry = model.getCountriesHolder().getSelectedCountry();
            feedbackSelectedCountry(selectedCountry);

            const removeButtons = document.querySelectorAll('[type="button"].remove');
            removeButtons.forEach((b) => {
                b.addEventListener("click", (event) => {
                    const countries = model.getCountriesHolder().get();
                    const index = countries.indexOf(event.currentTarget.name);
                    if (index > -1) {
                        countries.splice(index, 1);
                    }
                    const countries2 = model.getCountriesHolder().write(countries);
                    refresh(countries2);
                })
            });

            const $populationToggle = $('[type="button"]#populationToggle');
            function feedbackPopulationColumnVisible() {
                const isPopulationColumnVisible = model.getToggle("togglePopulationColumnVisibility") === "visible";
                if (isPopulationColumnVisible) {
                    $populationToggle.addClass('active');
                } else {
                    $populationToggle.removeClass('active');
                }
            }
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

            $("#legend td.country").on('click', (e) => {
                const selectedCountry = model.getCountriesHolder().toggleSelectedCountry($(e.currentTarget).attr('name'));
                feedbackSelectedCountry(selectedCountry);
            });

            function displayFoldedLegend(folded) {
                $("#legend table tbody").data("folded", folded);
                if (folded) {
                    // hide all rows not selected, leave the header row visible
                    $("#legend table tbody tr:not(.selected):not(:first-child)").hide();
                    $("#legend table tbody tr.selected").show();
                    $("#legendToggle").addClass("folded");
                } else {
                    // show all rows
                    $("#legend table tbody tr").css("display", "table-row");
                    $("#legendToggle").removeClass("folded");
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
                const $tbody = $("#legend table tbody");
                const fold = !$tbody.data("folded");
                $tbody.data("folded", fold);
                model.setToggle("toggleLegend", fold ? "folded" : "unfolded")
                displayFoldedLegend(fold);
            });

            $("main #legendSelectionUp").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const newSelectedCountry = model.selectionUp();
                feedbackSelectedCountry(newSelectedCountry, true);
            });

            $("main #legendSelectionDown").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const newSelectedCountry = model.selectionDown();
                feedbackSelectedCountry(newSelectedCountry, true);
            });

            window.ps.subscribe(pubSubKey, (e) => {
                console.log("received " + e);
            });

        }
    }
}
