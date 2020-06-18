'use strict';

const formatTime = d3.timeFormat("%e %B");

let d3totici = undefined;
let fractionDigits = 0;

function formatExplanation(isTotal, isPercapita, sizeOfAverage) {
    let e = [];
    if (isTotal || sizeOfAverage < 2) {
        fractionDigits = 0;
    } else {
        // average
        fractionDigits = 2;
        e.push(sizeOfAverage + " days average");
    }
    if (isPercapita) {
        fractionDigits = 2;
        e.push("&permil; per million");
    } else if (sizeOfAverage < 2) {
        // absolute
        fractionDigits = 0;
    }
    return e.join("<br>");
}

function formatNummer(input) {
    return input.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

function formatNummerWithSign(input) {
    const shown = formatNummer(Math.abs(input));
    let sign;
    if (+shown == 0) {
        sign = '';
    } else {
        sign = input < 0 ? '-' : '+';
    }
    return `${sign}${shown}`;
}

export function hideTooltip() {
    if (d3totici && d3totici.node() && d3totici.node()._tippy) {
        d3totici.node()._tippy.hide();
    }
}

export function setupTooltip(rootG, points, color, country, isTotal, isPercapita, sizeOfAverage) {

    d3.select("#totici").remove();
    d3totici = rootG.append("circle")
        .attr("id", "totici")
        .attr("stroke", "none")
        .attr("fill", "gray")
        .attr("fill-opacity", 0);

    $(".tippy-popper").remove();

    tippy('#totici', {
        followCursor: 'horizontal',
        allowHTML: true,
        theme: 'light', /* uncomment to debug :
        hideOnClick: false,
        trigger: 'click', */
    });

    const explanatino = formatExplanation(isTotal, isPercapita, sizeOfAverage);

    points.on("mouseover", function (d, e) {

        const d3this = d3.select(this);
        const $this = $(this);
        const nummerTheDayBefore = +$this.prev().attr("data-nummer");
        
        const opti = {
            isTotal: isTotal,
            country: country,
            countryColor: color(country),
            date: formatTime(d.date),
            explanation: explanatino,
            yesterday: formatNummer(nummerTheDayBefore),
            delta: formatNummerWithSign(d.nummer - nummerTheDayBefore),
            today: formatNummer(d.nummer),
        }

        d3totici
            .attr("cx", d3this.attr("cx"))
            .attr("cy", d3this.attr("cy"))
            .attr("r", 7)
            .style("fill-opacity", .3);

        d3totici.node()._tippy.setContent(tooltipTemplate(opti));

    }).on("mouseout", (d) => {
    });

    $("svg#chart").on("click", (e) => {
        if (!$(e.target).is("circle")) {
            hideTooltip();
        }
    });
}