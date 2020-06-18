'use strict';

export function Legend() {
    'use strict';

    // legend
    return {
        draw: (rootG, properties, handlebarsTemplate, refresh) => {

            const color = d3.scaleOrdinal().range(d3.schemeCategory10);
            // Set the color domain equal to the countries
            const countries = properties.getCountriesHolder().get();
            color.domain(countries);

            const isPopulationColumnVisible = properties.getToggle("togglePopulationColumnVisibility") === "visible";

            const $legend = $("main #legend");

            Handlebars.registerHelper("color", (country) => 'style="color:' + color(country) + ';"');
            Handlebars.registerHelper("format", (number) => number.toLocaleString());
            Handlebars.registerHelper("pop-style", () => 'style="display:' + (isPopulationColumnVisible ? 'table-cell' : 'none') + '"');

            $legend.html(handlebarsTemplate(properties.getCountriesHolder().getAsArray()));

            function feedbackSelectedCountry(selectedCountry) {
                // legend
                $('#legend td.country.active').removeClass("active");
                $('#legend tr').removeClass("selected");
                // chart
                $('#chart .category').removeClass('active');
                $('#chart .category').removeClass('inactive');
                // points toggle
                $('[data-toggle="toggle"]#togglePoints').bootstrapToggle('disable');
                $('label#togglePoints, img#togglePoints').css({ opacity: .2 });
                // selection navigator
                $("main #legendSelectionUp").attr("disabled", true);
                $("main #legendSelectionDown").attr("disabled", true);

                if (selectedCountry) {
                    // legend
                    const $me = $('#legend td.country[name="' + selectedCountry + '"]');
                    $me.addClass("active");
                    $me.parent().addClass("selected");
                    // chart
                    $('#chart .category').addClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').removeClass('inactive');
                    $('#chart .category[name="' + selectedCountry + '"]').addClass('active');
                    // points toggle
                    $('[data-toggle="toggle"]#togglePoints').bootstrapToggle('enable');
                    $('label#togglePoints, img#togglePoints').css({ 'text-decoration': "none", opacity: 1 });
                    // selection navigator
                    $("main #legendSelectionUp").attr("disabled", false);
                    $("main #legendSelectionDown").attr("disabled", false);
                }
            }
            const selectedCountry = properties.getCountriesHolder().getSelectedCountry();
            feedbackSelectedCountry(selectedCountry);

            const removeButtons = document.querySelectorAll('[type="button"].remove');
            removeButtons.forEach((b) => {
                b.addEventListener("click", (event) => {
                    const countries = properties.getCountriesHolder().get();
                    const index = countries.indexOf(event.currentTarget.name);
                    if (index > -1) {
                        countries.splice(index, 1);
                    }
                    const countries2 = properties.getCountriesHolder().write(countries);
                    refresh(countries2);
                })
            });

            const $populationToggle = $('[type="button"]#populationToggle');
            function feedbackPopulationColumnVisible() {
                const isPopulationColumnVisible = properties.getToggle("togglePopulationColumnVisibility") === "visible";
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
                        properties.setToggle("togglePopulationColumnVisibility", "hidden");
                        pop.setAttribute("style", "display: none");
                    } else {
                        properties.setToggle("togglePopulationColumnVisibility", "visible");
                        pop.setAttribute("style", "display:table-cell");
                    }
                }
                feedbackPopulationColumnVisible();
            });

            $("#legend td.country").on('click', (e) => {
                const selectedCountry = properties.getCountriesHolder().toggleSelectedCountry($(e.currentTarget).attr('name'));
                feedbackSelectedCountry(selectedCountry);
                refresh();
            });

            function displayFoldedLegend(folded) {
                $("#legend table tbody").data("folded", folded);
                if (folded) {
                    // hide all rows not selected, leave the header row visible
                    $("#legend table tbody tr:not(.selected):not(:first-child)").css("display", "none");
                    $("#legendToggle").addClass("folded");
                } else {
                    // show all rows
                    $("#legend table tbody tr").css("display", "table-row");
                    $("#legendToggle").removeClass("folded");
                }
            }

            // unfold legend when selectedCountry is not in country set
            let folded = properties.getToggle("toggleLegend") === "folded";
            if (folded) {
                if (!properties.getCountriesHolder().get().includes(selectedCountry)) {
                    properties.setToggle("toggleLegend", "unfolded");
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
                properties.setToggle("toggleLegend", fold ? "folded" : "unfolded")
                displayFoldedLegend(fold);
            });

            $("main #legendSelectionUp").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (properties.selectionUp()) {
                    $('#legend td.country.active')[0].scrollIntoView();
                    refresh();
                    console.log("up");
                }
            });

            $("main #legendSelectionDown").unbind().on('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (properties.selectionDown()) {
                    refresh();
                    $('#legend td.country.active')[0].scrollIntoView();
                    console.log("down");
                }
            });
        }
    }
}
