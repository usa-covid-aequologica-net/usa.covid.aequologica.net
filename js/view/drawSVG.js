'use strict';

import { Legend } from './legend.js';
import { setupTooltip, hideTooltip } from './tooltip.js';

export function draw(rootG, properties, PRINT, doNotAnimate, callback) {

    const isLogarithmic = properties.getToggle("toggleLinear") === "logarithmic"
    const isPercapita = properties.getToggle("toggleCapita") === "percapita";
    const isTotal = properties.getToggle("toggleCumula") === "total";
    const measure = properties.getMeasure();
    const measureType = measure.getType();
    const selectedCountry = properties.getCountriesHolder().getSelectedCountry();
    const sizeOfAverage = properties.getSizeOfAverage();
    const startDate = properties.getStartDate();
    const countryMap = properties.getCountriesHolder().getAsMap();

    if (rootG) {
        rootG.attr("transform", " translate(10 10)");

        // define margins
        const originalWidth = parseInt(d3.select("#chart").style("width"), 10);
        const originalHeight = parseInt(d3.select("#chart").style("height"), 10);
        const margin = { top: 12, right: 50, bottom: 30, left: 12 };
        const width = originalWidth - margin.left - margin.right,
            height = originalHeight - margin.top - margin.bottom;

        // define scales & color
        const xScale = d3.scaleTime().range([0, width]);
        const yScale = (isLogarithmic ? d3.scaleSymlog() : d3.scaleLinear()).range([height, 0]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10);

        // define axes
        const xAxis = d3.axisBottom().scale(xScale);
        const yAxis = d3.axisRight().scale(yScale);
        const yGrid = d3.axisLeft().scale(yScale);

        function which(country, d) {
            let nummer;
            let tot;
            if (isTotal) {
                nummer = d.total[measureType];
                tot = d.total.deaths;
            } else {
                if (sizeOfAverage < 2) {
                    nummer = d.delta[measureType];
                    tot = d.delta.deaths;
                } else {
                    nummer = d.deltaMovingAverage[measureType];
                    tot = d.deltaMovingAverage.deaths;
                }
            }
            if (isPercapita) {
                const pop = countryMap[country].count;
                nummer = 1000000 * nummer / pop;
                tot = 1000000 * tot / pop;
            }
            return { nummer: nummer, tot: tot, date: d.date };
        }

        const sorted = properties.getFetchResults().lasts.sort((a, b) => {
            let A;
            let B;
            if (isTotal) {
                A = a.total[measureType];
                B = b.total[measureType];
            } else {
                if (sizeOfAverage < 2) {
                    A = a.delta[measureType];
                    B = b.delta[measureType];
                } else {
                    A = a.deltaMovingAverage[measureType];
                    B = b.deltaMovingAverage[measureType];
                }
            }
            if (!A || !B) {
                return 0;
            }
            if (!countryMap[a.name]) {
                console.log("no /" + a.name + "/ in countryMap", countryMap);
            }
            if (!countryMap[b.name]) {
                console.log("no /" + b.name + "/ in countryMap", countryMap);
            }
            if (isPercapita && countryMap[a.name] && countryMap[b.name]) {
                A = 1000000 * A / countryMap[a.name].count;;
                B = 1000000 * B / countryMap[b.name].count;
            }
            return B - A;
        });
        
        // Read in data
        const data = properties.getFetchResults().data;

        const countries = properties.getCountriesHolder().get();

        // Set the color domain equal to the countries
        color.domain(countries);

        // reformat data to make it more copasetic for d3
        let categories = countries.map((country) => {
            return {
                category: country,
                datapoints: _.map(_.filter(data[country], (d) => moment(d.date).isSameOrAfter(startDate)), (d) => which(country, d))
            };
        });

        // define lines
        const line = d3
            .line()
            .curve(d3.curveCatmullRom)
            .x((d) => { return xScale(d.date); })
            .y((d) => { return yScale(d.nummer); });

        // @TODO: add trendline with https://observablehq.com/@harrystevens/d3-regression-with-datetimes?collection=@harrystevens/d3-regression
        let products; // extern, used by drawPoints()
        if (countries.length > 0 && categories.length > 0) {

            // set the domain of the axes
            xScale.domain(
                d3.extent(categories[0].datapoints, d => d.date)
            );
            function getYExtent() {
                const yExtents = [];
                _.each(categories, category => {
                    yExtents.push(d3.extent(category.datapoints, d => d.nummer));
                });
                const yExtent = [
                    0 /* d3.min(yExtents, d => d[0])*/,
                    d3.max(yExtents, d => d[1])
                ];
                return yExtent;
            }
            yScale.domain(getYExtent());

            // add axes; formatting is in resize()
            rootG
                .append("g")
                .attr("class", "x axis")
                .call(xAxis);

            rootG
                .append("g")
                .attr("class", "y axis")
                .call(yAxis.tickFormat(
                    d => (d >= 1000 ? (d / 1000).toLocaleString() + "k" : d.toLocaleString())
                ));

            rootG.append("g")
                .attr("class", "grid")
                .style("stroke-dasharray", ("2,8"))
                .call(yGrid
                    .tickSize(-width)
                    .tickFormat("")
                );

            products = rootG
                .selectAll(".category")
                .data(categories)
                .enter()
                .append("g")
                .attr("class", d => {
                    if (selectedCountry) {
                        return "category " + (d.category === selectedCountry ? "active" : "inactive");
                    }
                    return "category";
                })
                .attr("id", (d, i) => {
                    return "country_" + i;
                }).attr("name", d => {
                    return d.category;
                }).attr("color", d => {
                    return color(d.category);
                });

            products
                .append("path")
                .attr("class", "line")
                .attr("id", (d, i) => {
                    return "line_" + i;
                })
                .attr("d", d => {
                    return line(d.datapoints);
                })
                .style("stroke", d => {
                    return color(d.category);
                });

        }
        // animate cf. http://bl.ocks.org/fryford/2925ecf70ac9d9b51031
        function animate() {
            if (!PRINT) {
                const cssEncode = cat => cat.replace(/'/g, "\\'"); // pour "Côte d'Ivoire" (beware the ' !)

                // select All of the lines and process them one by one
                d3.selectAll(".line").each((d, i) => {
                    // get the length of each line in turn
                    const ID = ".category[name='" + cssEncode(d.category) + "'] .line#line_" + i;
                    const sel = d3.select(ID);
                    if (0 < sel.size() && sel.node()) {
                        const totalLength = sel.node().getTotalLength();
                        const line = d3.selectAll(ID)
                            .attr("stroke-dashoffset", totalLength)
                            .attr("stroke-dasharray", totalLength + " " + totalLength)
                            .transition().duration(2500)
                            .attr("stroke-dashoffset", 0);
                    }
                });
            }
        }

        // define responsive behavior
        function resize() {
            const d3chart = d3.select("#chart");
            if (!d3chart || d3chart.size() == 0) {
                return;
            }
            const width = parseInt(d3chart.style("width"), 10) - margin.left - margin.right,
                height = parseInt(d3chart.style("height"), 10) - margin.top - margin.bottom;

            // Update the range of the scale with new width/height
            xScale.range([0, width]);
            yScale.range([height, 0]);

            // Update the axis and text with the new scale
            rootG.select(".x.axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("transform", "translate(-10,10)rotate(-45)")
                .style("font-size", "smaller");
            rootG.select(".y.axis")
                .attr("transform", "translate(" + width + " ,0)")
                .call(yAxis)
                .selectAll("text")
                .style("font-size", "smaller");
            rootG.select(".grid")
                .call(yGrid);
            // update the tick marks
            xAxis.ticks(Math.max(width / 75, 2));
            yAxis.ticks(Math.max(height / 50, 2));
            yGrid.ticks(Math.max(height / 50, 2));

            // force D3 to recalculate and update the line
            rootG.selectAll(".grid")
                .call(yGrid
                    .tickSize(-width)
                );
            rootG.selectAll(".line").attr("d", (d) => {
                return line(d.datapoints);
            });

            if (!doNotAnimate) {
                animate();
            }
        }

        // call resize whenever a resize event occurs
        d3.select(window).on("resize", _.debounce(() => {
            resize();
        }, 750));

        // call the resize function
        resize();
    }

    Legend().draw(
        rootG,
        properties,
        legendTemplate,
        callback,
    );
}
