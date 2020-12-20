'use strict';

export const log = (sel) => {

    var margin = { top: 12, right: 12, bottom: 12, left: 12 },
        width = 160 - margin.left - margin.right,
        height = 140 - margin.top - margin.bottom;
    const trans = 0;

    var x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    var y = d3.scaleLog()
        .base(Math.E)
        .domain([Math.exp(0), Math.exp(9)])
        .range([height, 0]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .tickValues([]);

    var yAxis = d3.axisLeft()
        .scale(y)
        .tickValues([]);

    var line = d3.line()
        .x(function (d) { return x(d[0]); })
        .y(function (d) { return y(d[1]); });

    var svg = d3.select(sel).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("transform", "translate(-" + trans + ",0)")
        .call(yAxis)
        .style("stroke-width", "4px");

    svg.append("g")
        .attr("transform", "translate(0," + (height + trans) + ")")
        .call(xAxis)
        .style("stroke-width", "5px");

    svg.append("path")
        .datum(d3.range(100).map(function (x) {
            const y = x * x + x + 1;
            x = x + 10;
            // console.log(x, y);
            return [x, y];
        }))
        .attr("class", "line")
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "10px")
        .attr("d", line);

    return d3.select('svg').node();
}

export function saveSvg(svgEl, name) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


