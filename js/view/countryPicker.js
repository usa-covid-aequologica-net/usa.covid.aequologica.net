'use strict';

import { populationByCountry } from '../model/population.js';

let countriesHolder;
let selector;
let $table_sorter;
let dirty;

let emptyThenAppend;

export function init(...args) {
    const [countriesHolderParam, selectorParam] = args;

    if (countriesHolder) {
        throw "there is only one country picker";
    }

    countriesHolder = countriesHolderParam;
    selector = selectorParam;
    $table_sorter = $(selector + " table").tablesorter({
        theme: "bootstrap",
        sortList: [[0, 0]],
    });

    function stopEventAndWriteCountries(event) {
        event.preventDefault();
        event.stopPropagation();

        let countries = [];
        const checkedCheckboxes = $(selector + " table input:checkbox:checked");
        checkedCheckboxes.each(function (i, val) {
            countries.push($(val).prop("name"));
        });
        countriesHolder.write(countries);
        dirty = true;
        $table_sorter.trigger('update');
    }

    function syncTableSorter() {

        $('#countriesInModal th.population').data('sorter', 'digit');


        const $trs = $(selector + " table tbody tr");
        $trs.on("change", (event) => {
            const $eventTarget = $(event.target);
            if ($eventTarget.is("input")) {
                const $tr = $eventTarget.closest('tr');
                const $cb = $eventTarget;

                const $truc = $tr.find("#trucAndAstuceForTableSorter");
                $truc.text(($cb.is(':checked') ? "checked" : "unchecked") + "_" + $cb.prop("name"));

                stopEventAndWriteCountries(event);
            }
        }).on("mouseup", (event) => {
        });

        $table_sorter.trigger('update');
    }

    function onKeypress(e) {
        if (e.which == 13) {
            const $eventTarget = $(window.getSelection().anchorNode);
            const $td = $eventTarget.closest('td.name');

            if ($td.length > 0) {
                const $tr = $eventTarget.closest('tr');
                const $cb = $tr.find("input")

                $cb.prop('checked', !$cb.prop('checked'));

                const $truc = $tr.find("#trucAndAstuceForTableSorter");
                $truc.text(($cb.is(':checked') ? "checked" : "unchecked") + "_" + $cb.prop("name"));

                stopEventAndWriteCountries(event);
            }

        }
    }

    emptyThenAppend = (countries) => {
        const $tbody = $(selector + " table tbody");
        $tbody.empty();

        let i = 0;
        populationByCountry.forEach((country) => {
            const isChecked = _.sortedIndexOf(countries, country.name) >= 0;
            const html = rowTemplate({
                index: i,
                name: country.name,
                code: country.code,
                flag: country.code.toLowerCase(),
                population: country.count.toLocaleString(),
                checked: (isChecked ? "checked" : ""),
                trucAndAstuce: (isChecked ? "checked_" : "unchecked_") + country.name,
            });
            $tbody.append(html);
            i = i + 1;
        });

        syncTableSorter();

        dirty = false;
    }

    const set = (countries) => {
        const $checkboxes = $(selector + " table input:checkbox");
        $checkboxes.each((index, value) => {
            const $cb = $(value);
            const $tr = $cb.closest('tr');
            const $truc = $tr.find("#trucAndAstuceForTableSorter");

            const name = $cb.prop("name");
            if (0 <= _.sortedIndexOf(countries, name)) {
                $(value).prop('checked', 'checked');
                $truc.text("checked_" + name);
            } else {
                $(value).prop('checked', false);
                $truc.text("unchecked_" + name);
            }
        });
        $table_sorter.trigger('update');
    }

    $("#countriesInModal #resetToFactory").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        let countries = countriesHolder.reset();
        dirty = true;
        set(countries);
    });

    $("#countriesInModal #selectAll").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        let aa = [];
        $("input[type='checkbox']").each((i, c) => {
            const cn = $(c).prop('name');
            if (cn) aa.push(cn);
        });

        let countries = countriesHolder.write(aa);
        dirty = true;
        set(countries);
    });

    $("#countriesInModal #unselectAll").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        let countries = countriesHolder.write([]);
        dirty = true;
        set(countries);
    });

    return {
        beforeOpen: () => {
            emptyThenAppend(countriesHolder.get());
            // Execute a function when the user releases a key on the keyboard
            $(document).on('keypress', onKeypress);

        },
        afterClose: () => {
            $(document).off('keypress');
            return dirty;
        }
    };

}
