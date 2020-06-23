'use strict';

import { setupTooltip } from './tooltip.js';

let pubSubToken;
let flyingCategories;
let flyingXScale;
let flyingYScale;

export function draw(...args) {
    const [rootG, properties, categories, PRINT, doNotAnimate] = args;

    flyingCategories = categories;

    if (pubSubToken) {
        window.ps.unsubscribe(pubSubToken);
        pubSubToken = undefined;
    }

    if (!rootG) {
        return
    }

    rootG.attr("transform", " translate(10 10)");

    // define margins
    const originalWidth = parseInt(d3.select("#chart").style("width"), 10);
    const originalHeight = parseInt(d3.select("#chart").style("height"), 10);
    const margin = { top: 12, right: 50, bottom: 30, left: 12 };
    const width = originalWidth - margin.left - margin.right,
        height = originalHeight - margin.top - margin.bottom;

    // define scales & color
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = (properties.isLogarithmic ? d3.scaleSymlog().range([height, 0]) : d3.scaleLinear().range([height, 0])).nice();
    flyingXScale = xScale;
    flyingYScale = yScale;
    const color = d3.scaleOrdinal().range(d3.schemeCategory10);
    // Set the color domain equal to the countries
    color.domain(properties.countries);

    // define axes
    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisRight().scale(yScale);
    const yGrid = d3.axisLeft().scale(yScale);

    // define lines
    const line = d3
        .line()
        .curve(d3.curveCatmullRom)
        .x((d) => { return xScale(d.date); })
        .y((d) => { return yScale(d.nummer); });

    // @TODO: add trendline with https://observablehq.com/@harrystevens/d3-regression-with-datetimes?collection=@harrystevens/d3-regression
    if (properties.countries.length > 0 && categories.length > 0) {

        // set the domain of the axes
        xScale.domain(
            d3.extent(categories[0].datapoints, d => d.date)
        );
        flyingXScale = xScale;
        function getYExtent() {
            const yExtents = [];
            _.each(categories, category => {
                yExtents.push(d3.extent(category.datapoints, d => d.nummer));
            });
            const yExtent = [
                d3.min(yExtents, d => d[0]),
                d3.max(yExtents, d => d[1])
            ];
            if (yExtent[0] < 0) {
                yExtent[0] = 0;
            }
            return yExtent;
        }
        yScale.domain(getYExtent());

        // add axes; formatting is in resize()
        rootG
            .append("g")
            .attr("class", "x axis")
            .call(xAxis.ticks(20));

        rootG
            .append("g")
            .attr("class", "y axis")
            .call(yAxis.ticks(20, '~s')/*tickFormat(
                
                d => (d >= 1000 ? (d / 1000).toLocaleString() + "k" : d.toLocaleString())
            )*/);

        rootG.append("g")
            .attr("class", "grid")
            .call(yGrid
                .ticks(20, '~s')
                .tickSize(-width)
                .tickFormat("")
            );

        const products = rootG
            .selectAll(".category")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", d => {
                if (properties.selectedCountry) {
                    return "category " + (d.category === properties.selectedCountry ? "active" : "inactive");
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

        pubSubToken = window.ps.subscribe("SELECTED_COUNTRY", (msg, data) => {
            drawPoints(msg);
        });

        function drawPoints(selectedCountry) {

            const country = selectedCountry || (categories.length === 1 ? categories[0].category : undefined);

            // do not show on mobile or tablet
            const canHover = !(matchMedia('(hover: none)').matches);
            if (!canHover) {
                return;
            }

            // between try/catch: points and tooltip is not worth crashing the app
            try {
                d3.selectAll("circle.point").remove();
                if (country) {
                    const sel = _.find(flyingCategories, c => c.category === country);
                    const points = rootG.selectAll("points")
                        .data(sel.datapoints)
                        .enter()
                        .append("circle")
                        .attr("cx", d => flyingXScale(d.date))
                        .attr("cy", d => flyingYScale(d.nummer))
                        .attr("r", 5)
                        .attr("data-nummer", d => d.nummer)
                        .attr("class", "point");

                    // tooltip
                    setupTooltip(rootG, points, color, country, properties);
                }
            } catch (err) {
                console.log(err);
            }

        }

        // drawPoints(properties.selectedCountry); // not needed : will be called when drawing legend
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
        if (properties.isLogarithmic) {
            yScale.range([height, 0]);
        } else {
            yScale.range([height, 0]);
        }
        flyingXScale = xScale;
        flyingYScale = yScale;

        // Update the axis and text with the new scale
        rootG.select(".x.axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "translate(-10,10)rotate(-45)");
        rootG.select(".y.axis")
            .attr("transform", "translate(" + width + " ,0)")
            .call(yAxis)
            .selectAll("text");
        rootG.select(".grid")
            .call(yGrid);
        // force D3 to recalculate and update the line
        rootG.selectAll(".grid")
            .call(yGrid
                .tickSize(-width)
            );
        rootG.selectAll(".line").attr("d", (d) => {
            return line(d.datapoints);
        });

        rootG.selectAll("circle.point")
            .attr("cx", (d) => {
                return xScale(d.date);
            })
            .attr("cy", (d) => {
                return yScale(d.nummer)
            });

        if (0 < $(".tippy-popper").length && $(".tippy-popper")[0]._tippy) {
            $(".tippy-popper")[0]._tippy.hide();
        }

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
