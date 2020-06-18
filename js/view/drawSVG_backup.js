'use strict';

import { Legend } from './legend.js';
import { setupTooltip, hideTooltip } from './tooltip.js';

export function draw(rootG, properties, PRINT, doNotAnimate, callback) {

    const measure = properties.getMeasure();
    const measureType = measure.getType();
    const isTotal = properties.getToggle("toggleCumula") === "total";
    const isLogarithmic = properties.getToggle("toggleLinear") === "logarithmic"
    const deathsAreVisible = properties.getToggle("toggleDeaths") === "visible" && !PRINT && measureType !== "deaths";
    const isPercapita = properties.getToggle("toggleCapita") === "percapita";
    const pointsAreVisible = properties.getToggle("togglePoints") === "showpoints";
    const sizeOfAverage = properties.getSizeOfAverage();
    const selectedCountry = properties.getCountriesHolder().getSelectedCountry();
    let sel;

    if (rootG) {
        if (deathsAreVisible && selectedCountry) {
            rootG.attr("transform", " translate(30 10) scale(.98 1)");
        } else {
            rootG.attr("transform", " translate(10 10)");
        }

        // define margins
        const originalWidth = parseInt(d3.select("#chart").style("width"), 10);
        const originalHeight = parseInt(d3.select("#chart").style("height"), 10);
        const margin = { top: 12, right: 50, bottom: 30, left: 12 };
        const width = originalWidth - margin.left - margin.right,
            height = originalHeight - margin.top - margin.bottom;

        // define scales
        const xScale = d3.scaleTime().range([0, width]);
        const yScale = (isLogarithmic ? d3.scaleSymlog() : d3.scaleLinear()).range([height, 0]);
        const yScaleTot = (isLogarithmic ? d3.scaleSymlog() : d3.scaleLinear()).range([height, 0]);
        const color = d3.scaleOrdinal().range(d3.schemeCategory10);

        // define axes
        const xAxis = d3.axisBottom().scale(xScale);
        const yAxis = d3.axisRight().scale(yScale);
        const yAxisTot = d3.axisLeft().scale(yScaleTot);
        const yGrid = d3.axisLeft().scale(yScale);

        // define lines
        const line = d3
            .line()
            .curve(d3.curveCatmullRom)
            .x((d) => { return xScale(d.date); })
            .y((d) => { return yScale(d.nummer); });
        const lineTot = d3
            .line()
            .curve(d3.curveCatmullRom)
            .x((d) => { return xScale(d.date); })
            .y((d) => { return yScaleTot(d.tot); });

        /* rootG.attr("transform", "translate(" + margin.left + "," + margin.top + ")") */

        // Read in data
        let data = _.cloneDeep(properties.getFetchResults().data);

        const countries = properties.getCountriesHolder().get();

        // Set the color domain equal to the countries
        color.domain(countries);

        // format the data 
        // @TODO: : should go to data.js
        if (countries.length > 0) {
            countries.forEach((country) => {
                const map = properties.getCountriesHolder().getAsMap();
                const pop = map[country].count/* || map[country]*/;

                let previousMeasure = _.clone(measure.typesObject);
                if (!data[country]) {
                    console.log(country, "OUILLEE, no data !?");
                    return;
                }
                data[country].forEach((d) => {
                    d.delta = _.clone(measure.typesObject);
                    d.total = _.clone(measure.typesObject);
                    d.deltaMovingAverage = _.clone(measure.typesObject);
                    _.each(measure.typesArray, (m) => {
                        d.total[m] = d[m];
                        d.delta[m] = d[m] - previousMeasure[m];
                        /* if (d.delta[m] < 0) {
                            console.log(country);
                        } */
                        d.deltaMovingAverage[m] = d.delta[m];
                        if (isPercapita) {
                            d.delta[m] = 1000000 * d.delta[m] / pop;
                            d.total[m] = 1000000 * d.total[m] / pop;
                        }
                        previousMeasure[m] = d[m];
                    });
                });

                _.each(measure.typesArray, (m) => {
                    const deltas = _.map(data[country], 'delta.' + m);
                    let deltasMovingAverage = sma(deltas, sizeOfAverage, x => x);

                    let i = 1;
                    data[country].forEach((d) => {
                        if (i <= sizeOfAverage) {
                            d.deltaMovingAverage[m] = d.total[m] / i;
                        } else {
                            d.deltaMovingAverage[m] = deltasMovingAverage[i - sizeOfAverage];
                        }
                        i = i + 1;
                    });
                });

                data[country].forEach((d) => {
                    if (isTotal) {
                        d.nummer = d.total[measureType];
                        d.tot = d.total.deaths;
                    } else {
                        if (sizeOfAverage < 2) {
                            d.nummer = d.delta[measureType];
                            d.tot = d.delta.deaths;
                        } else {
                            d.nummer = d.deltaMovingAverage[measureType];
                            d.tot = d.deltaMovingAverage.deaths;
                        }
                    }
                });

                data[country] = _.filter(data[country], (d) => moment(d.date).isSameOrAfter(properties.getStartDate()));
            });
        }

        // reformat data to make it more copasetic for d3
        let categories = countries.map((country) => {
            return {
                category: country,
                datapoints: _.map(data[country], (d) => { return { nummer: d.nummer, tot: d.tot, date: d.date } })
            };
        });

        if (selectedCountry) {
            sel = _.find(categories, c => c.category === selectedCountry);
        }
        
        // @TODO: add trendline with https://observablehq.com/@harrystevens/d3-regression-with-datetimes?collection=@harrystevens/d3-regression
        let products; // extern, used by drawPoints()
        if (countries.length > 0 && categories.length > 0) {
            // set the domain of the axes
            xScale.domain(
                d3.extent(categories[0].datapoints, d => d.date)
            );
            function getYExtent(tot) {
                const yExtents = [];
                _.each(categories, category => {
                    if (tot) {
                        yExtents.push(d3.extent(category.datapoints, d => d.tot));
                    } else {
                        yExtents.push(d3.extent(category.datapoints, d => d.nummer));
                    }

                });
                const yExtent = [
                    0 /* d3.min(yExtents, d => d[0])*/,
                    d3.max(yExtents, d => d[1])
                ];
                return yExtent;
            }
            yScale.domain(getYExtent());
            yScaleTot.domain(getYExtent(true));

            // add axes; formatting is in resize()
            rootG
                .append("g")
                .attr("class", "x axis")
                /*.attr("transform", "translate(-25," + (height+5) + ")")*/
                .call(xAxis);

            rootG
                .append("g")
                .attr("class", "y axis nichtTot")
                /*.attr("transform", "translate(" + width + ", 0)")*/
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

            // between try/catch: points and tooltip is not worth crashing the app
            try {
                if (pointsAreVisible && selectedCountry) {
                    const points = rootG.selectAll("points")
                        .data(sel.datapoints)
                        .enter()
                        .append("circle")
                        .attr("cx", d => xScale(d.date))
                        .attr("cy", d => yScale(d.nummer))
                        .attr("r", 5)
                        .attr("data-nummer", d => d.nummer)
                        .attr("class", "point");

                    // tooltip
                    const canHover = !(matchMedia('(hover: none)').matches);
                    if (canHover) {
                        setupTooltip(rootG, points, color, selectedCountry, isTotal, isPercapita, sizeOfAverage);
                    }
                }
            } catch (err) {
                console.log(err);
            }

            if (deathsAreVisible && selectedCountry) {
                rootG
                    .append("g")
                    .attr("class", "y axis tot")
                    .call(yAxisTot.tickFormat(
                        d => (d >= 1000 ? (d / 1000).toLocaleString() + "k" : d.toLocaleString())
                    ));

                const sel = _.find(categories, c => c.category === selectedCountry);
                rootG
                    .append("g")
                    .append("path")
                    .attr("class", "line2")
                    .attr("id", (d, i) => {
                        return "line2_" + i;
                    })
                    .attr("d", d => {
                        return lineTot(sel.datapoints);
                    })
                    .style("stroke", d => {
                        return color(selectedCountry);
                    });
                
                if (doNotAnimate) {
                    deathLines.style("stroke-dasharray", "4 6");
                }
            }
        }

        // animate cf. http://bl.ocks.org/fryford/2925ecf70ac9d9b51031
        function animate() {
            if (!PRINT) {
                const cssEncode = cat => cat.replace(/'/g, "\\'");

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
                            .transition().duration(3000)
                            .attr("stroke-dashoffset", 0);
                    }
                });
                d3.selectAll(".line2").each((d, i) => {
                    // get the length of each line in turn
                    const ID2 = ".category[name='" + cssEncode(d.category) + "'] .line2#line2_" + i;
                    // const ID2 = "#line2_" + i;
                    const sel2 = d3.select(ID2);
                    if (0 < sel2.size() && sel2.node()) {
                        const totalLength = sel2.node().getTotalLength();

                        // https://www.visualcinnamon.com/2016/01/animating-dashed-line-d3
                        /////// Create the required stroke-dasharray to animate a dashed pattern ///////

                        //Create a (random) dash pattern
                        //The first number specifies the length of the visible part, the dash
                        //The second number specifies the length of the invisible part
                        const dashing = "4 6"

                        //This returns the length of adding all of the numbers in dashing
                        //(the length of one pattern in essence)
                        //So for "6,6", for example, that would return 6+6 = 12
                        const dashLength =
                            dashing
                                .split(/[\s,]/)
                                .map(function (a) { return parseFloat(a) || 0 })
                                .reduce(function (a, b) { return a + b });

                        //How many of these dash patterns will fit inside the entire path?
                        const dashCount = 1
                            + Math.ceil(totalLength / dashLength);

                        //Create an array that holds the pattern as often
                        //so it will fill the entire path
                        const newDashes = new Array(dashCount).join(dashing + " ");
                        //Then add one more dash pattern, namely with a visible part
                        //of length 0 (so nothing) and a white part
                        //that is the same length as the entire path
                        const dashArray = newDashes + " 0 " + totalLength;
                        /////// END ///////
                        /* 
                        path
                            .attr("stroke-dashoffset", totalLength)
                            //This is where it differs with the solid line example
                            .attr("stroke-dasharray", dashArray)
                            .transition().duration(3000).ease("linear")
                            .attr("stroke-dashoffset", 0);
                        */
                        const line = d3.selectAll(ID2)
                            .attr("stroke-dashoffset", totalLength)
                            .attr("stroke-dasharray", dashArray)
                            .transition().duration(3000)
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
            yScaleTot.range([height, 0]);

            // Update the axis and text with the new scale
            rootG.select(".x.axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("transform", "translate(-10,10)rotate(-45)")
                .style("font-size", "smaller");
            rootG.select(".y.axis.nichtTot")
                .attr("transform", "translate(" + width + " ,0)")
                .call(yAxis)
                .selectAll("text")
                .style("font-size", "smaller");
            rootG.select(".y.axis.tot")
                /* .attr("transform", "translate(" + width + " ,0)") */
                .call(yAxisTot)
                .selectAll("text")
                .style("font-size", "smaller");
            rootG.select(".grid")
                .call(yGrid);
            // update the tick marks
            xAxis.ticks(Math.max(width / 75, 2));
            yAxis.ticks(Math.max(height / 50, 2));
            yAxisTot.ticks(Math.max(height / 50, 2));
            yGrid.ticks(Math.max(height / 50, 2));

            // force D3 to recalculate and update the line
            rootG.selectAll(".grid")
                .call(yGrid
                    .tickSize(-width)
                );
            rootG.selectAll(".line").attr("d", (d) => {
                return line(d.datapoints);
            });
            rootG.selectAll(".line2").attr("d", (d) => {
                return lineTot(sel.datapoints);
            });
            rootG.selectAll("circle.point")
                .attr("cx", (d) => {
                    return xScale(d.date);
                })
                .attr("cy", (d) => {
                    return yScale(d.nummer)
                });

            // hide tooltip
            hideTooltip();

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
