"use strict";

import { init as initCountryPicker } from "./view/countryPicker.js";
import { draw as drawChart } from "./view/drawSVG.js";
import { Legend } from "./view/legend.js";
import { init as initModel } from "./model/data.js";
import { parseParams } from "./model/queryStringParser.js";
import { buildPermalink } from "./model/permalink.js";
import { store } from "./model/yetAnotherLocalStorageWrapper.js";
import { Carousel } from "./model/carousel.js";
import { populationByCountry } from "./model/population.js";
import { domain } from "./model/domain.js";
import { factory } from "./model/factory.js";
import { Fuzzy2Country } from "./model/fuzzy.js";
import { pubSubKeyGRAMMAR } from "./gram.js";
import { pubSubKeyKEYBOARD } from "./view/keyboard.js";
import { tickmarks } from "./view/tickmarks.js";

if (
  location.protocol !== "https:" &&
  window.location.hostname !== "localhost"
) {
  location.replace(
    `https:${location.href.substring(location.protocol.length)}`
  );
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
  let queryString = window.location.search.substring(1);
  return {
    queryString: parseParams(queryString),
  };
})();

// let's go
$(document).ready(() => {
  (function anonymous() {
    // should take care of not putting things in the global scope, shouldn't it ?

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
        doNotAnimate
      );

      // legend
      Legend().draw(model, legendTemplate, (c) => {
        redraw(c, true);
      });
    }

    // speech
    const fuzzy2country = new Fuzzy2Country();

    window.ps.subscribe(pubSubKeyGRAMMAR, (e) => {
      if (!e) return;

      if (e.action == "RESET") {
        model.getCountriesHolder().write(factory[domain]);
        redraw(model.getCountriesHolder().get());
        return;
      }
      if (e.action == "CLEAR") {
        model.getCountriesHolder().write([]);
        redraw(model.getCountriesHolder().get());
        return;
      }
      if (e.action == "UNSELECT") {
        model.getCountriesHolder().setSelectedCountry(undefined);
        window.ps.publish(pubSubKeyKEYBOARD, { event: "SPACE" });
        return;
      }
      if (e.action == "SELECT") {
        model
          .getCountriesHolder()
          .setSelectedCountry(fuzzy2country.convert(e.argument));
        window.ps.publish(pubSubKeyKEYBOARD, { event: "SPACE" });
        return;
      }
      // https://medium.com/@alvaro.saburido/set-theory-for-arrays-in-es6-eb2f20a61848
      if (e.action == "ADD" || e.action == "PLUS" || e.action == "+") {
        let union = [];
        if (Array.isArray(e.argument)) {
          // array of countries
          const squared = fuzzy2country.convert(e.argument);
          union = [...squared, ...model.getCountriesHolder().get()];
        } else if (typeof e.argument === "string" && e.argument === "ALL") {
          // ALL
          union = _.map(populationByCountry[domain], "name");
        }
        model.getCountriesHolder().write(union);
        redraw(model.getCountriesHolder().get());
        return;
      }
      if (e.action == "REMOVE" || e.action == "MINUS" || e.action == "-") {
        let difference = [];
        if (Array.isArray(e.argument)) {
          // array of countries
          const squared = fuzzy2country.convert(e.argument);
          difference = model
            .getCountriesHolder()
            .get()
            .filter((x) => !squared.includes(x));
        } else if (typeof e.argument === "string" && e.argument === "ALL") {
          // ALL
        }
        model.getCountriesHolder().write(difference);
        redraw(model.getCountriesHolder().get());
        return;
      }
      if (e.action == "SET") {
        let set = [];
        if (Array.isArray(e.argument)) {
          // array of countries
          set = fuzzy2country.convert(e.argument);
        } else if (typeof e.argument === "string" && e.argument === "ALL") {
          // ALL
          set = _.map(populationByCountry[domain], "name");
        }
        model.getCountriesHolder().write(set);
        redraw(model.getCountriesHolder().get());
        return;
      }
    });

    // start date
    function configureStartRangeInput(begin, end) {
      const BEGIN = begin || moment("2020-01-21");
      const start = model.getStartDate();
      const END = end || moment();

      $("#startFeedback > span").text(start.format("LL"));

      const max = Math.round(moment.duration(END.diff(BEGIN)).asDays());
      const now = Math.round(moment.duration(END.diff(start)).asDays());

      $("#startRangeInput").prop("min", 1);
      $("#startRangeInput").prop("max", max);
      $("#startRangeInput").prop("value", max - now);

      $("#startRangeInput")
        .on("change", (e) => {
          const qwe = $.prop(e.currentTarget, "valueAsNumber");
          console.log(qwe);
          const newDate = moment(BEGIN).add(qwe, "days");
          model.setStartDate(newDate);
          redraw();
        })
        .on("input", (e) => {
          const qwe = $.prop(e.currentTarget, "valueAsNumber");
          const newDate = moment(BEGIN).add(qwe, "days");
          $("#startFeedback > span").text(newDate.format("LL"));
        });
    }

    // various toggles
    model.forEachToggle((key, val) => {
      $('[data-bs-toggle="toggle"]#' + key).each((i, btn) => {
        const setOn = model.getToggle(key) === $(btn).data("taggle-on");
        // $(btn).bootstrapToggle(setOn ? "on" : "off");
        $("label#" + key + ", img#" + key).css("opacity", setOn ? "1" : ".666");
      });
    });

    $('footer [type="radio"], footer [type="checkbox"]').change((event) => {
      // which toggle
      const key = event.currentTarget.id;
      const isChecked = event.currentTarget.checked;
      const oldVal = model.getToggle(key);
      const newVal = isChecked
        ? $(event.currentTarget).data("taggle-on")
        : $(event.currentTarget).data("taggle-off");
      if (oldVal !== newVal) {
        model.setToggle(key, newVal);
        $("label#" + key + ", img#" + key).css(
          "opacity",
          isChecked ? "1" : ".666"
        );
        redraw();
      }
    });

    // cumula
    function cumula2averageFeedback(disable) {
      $('[type="range"]#sizeOfAverage').prop("disabled", disable);
      // $('label#bubble, label#average').css({ opacity: !disable ? 1 : .333 });
    }
    {
      const cumulat = model.getToggle("toggleCumula");
      $("#cumulat").parent().attr("data-color", cumulat);
      $("#cumulat").html(cumulat);
      $("#cumulaGroup .dropdown-toggle").dropdown();
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
      /* $('[data-bs-toggle="toggle"]#toggleDeaths').bootstrapToggle(
        enable ? "enable" : "disable"
      ); */
      $("label#toggleDeaths, img#toggleDeaths").css({
        opacity: enable ? 1 : 0.333,
      });
    }
    {
      const measure = model.getMeasure();
      $("#measure").parent().attr("data-color", measure.getType());
      $("#measure").html(measure.getType());
      $("#mesureGroup .dropdown-toggle").dropdown();
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
      function rightOrLeft(carousel) {
        const measure = model.getMeasure();
        const oldMeasure = measure.getType();
        const oldCumula = model.getToggle("toggleCumula");

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

      document.addEventListener("swiped-right", function (e) {
        return rightOrLeft(Carousel().right);
      });

      document.addEventListener("swiped-left", function (e) {
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
          .on("show.bs.modal", () => {
            if (!countryPicker) {
              countryPicker = initCountryPicker(
                model.getCountriesHolder(),
                "#modalCountryPicker table"
              );
            }
            {
              const countries_before_filter = store.get(
                "countries_before_filter"
              );
              if (countries_before_filter) {
                model
                  .getCountriesHolder()
                  .write(countries_before_filter.split(","));
                store.remove("countries_before_filter");
              }
              model.setToggle("toggleFilter", "off");
              const $filterToggle = $('[type="button"]#filterToggle');
              $filterToggle.addClass("active").children("img#filter").show();
              $filterToggle.addClass("active").children("img#eye").hide();
              $filterToggle.removeClass("active").children("sup").html("10");
              $filterToggle.attr("title", "top ten filter");
            }
            countryPicker.beforeOpen();
          })
          .on("hidden.bs.modal", () => {
            const dirty = countryPicker.afterClose();
            if (dirty) {
              redraw(model.getCountriesHolder().get());
            }
          });
      }
    }

    // absolute vs. per million inhabitants
    tickmarks(
      redraw,
      "#toggleCapita",
      () => model.getToggle("toggleCapita"),
      (l) => model.setToggle("toggleCapita", l),
      {
        decode: (enc) => ["percapita", "absolute"][enc],
        encode: (dec) => {
          return (dec === "percapita" ? 0 : 1);
        },
      },
      (a) => $("<span>"+(a === "percapita" ?"per million inhabitants ":"absolute")+"</span>")
    );
    
    // linear vs. logarithmic
    tickmarks(
      redraw,
      "#toggleLinear",
      () => model.getToggle("toggleLinear"),
      (l) => model.setToggle("toggleLinear", l),
      {
        decode: (enc) => ["linear", "logarithmic"][enc],
        encode: (dec) => {
          return (dec === "linear" ? 0 : 1);
        },
      }, // logarithmic vs. 
      (a) => $("<span>"+(a === "linear" ?"linear":"logarithmic")+" Y axis</span>")
    );
    
    // size of average
    tickmarks(
      redraw,
      "#sizeOfAverage",
      model.getSizeOfAverage,
      model.setSizeOfAverage,
      {
        decode: (enc) => [1, 2, 3, 4, 5, 6, 7, 14, 21, 28][enc],
        encode: (dec) => {
          if (dec <= 7) {
            return dec - 1;
          } else if (dec <= 14) {
            return 7;
          } else if (dec <= 21) {
            return 8;
          } else if (dec <= 28) {
            return 9;
          }
        },
      },
      (a) => {
        return $(
          "<span style='font-family: monospace; margin-right:.2rem;'>" +
            a +
            "</span>" +
            "<span>day</span>" +
            (a < 2
              ? "&nbsp;<span style='text-decoration: line-through; color: #9a9a9a;'>average</span>"
              : "<span>s&nbsp;average</span>")
        );
      }
    );

    /*{
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
            function averageFeedback(a) {
                const $qwe = $("<span style='font-family: monospace; margin-right:.2rem;'>"+a+"</span>"+
                               "<span>day</span>"
                        +(a < 2 ? "&nbsp;<span style='text-decoration: line-through; color: #9a9a9a;'>average</span>"
                                : "<span>s&nbsp;average</span>"
                    )
                );
                $("#sizeOfAverageLabel").empty().append($qwe);
            }
            averageFeedback(sizeOfAverage);
            const sizeOfAverageRange = document.querySelectorAll('#sizeOfAverage[type="range"]');
            if (sizeOfAverageRange) {
                sizeOfAverageRange.forEach((r) => {
                    r.addEventListener("input", () => {
                        const translated = values[r.value];
                        averageFeedback(translated);
                    });
                    r.addEventListener("change", () => {
                        const translated = values[r.value];
                        if (model.getSizeOfAverage() != translated) {
                            model.setSizeOfAverage(translated);
                            averageFeedback(translated);
                            redraw();
                        }
                    });
                });
            }
        }
        */

    // permalink
    $("#permalinkModal")
      .on("show.bs.modal", () => {
        buildPermalink(model).then((permalink) => {
          if (
            window.location.protocol !== "https:" &&
            window.location.hostname !== "localhost"
          ) {
            $("#permalinkModal").find("input").val(permalink);
            $("#permalinkModal")
              .find("label")
              .html(
                "focus, then ctrl-A, ctrl-C to copy permalink to clipboard"
              );
          } else {
            navigator.clipboard.writeText(permalink);
            $("#permalinkModal").find("input").remove();
            $("#permalinkModal")
              .find("label")
              .text("permalink copied to clipboard!");
          }
        });
      })
      .on("hidden.bs.modal", () => {});

    // location
    {
      const $location = $("header #location");
      {
        const countryCode = $("header #location").data("country-code");
        const country = model.getCountriesHolder().code2name(countryCode);
        $("header #location").data("country", country);
      }
      $("header #location").on("click", (e) => {
        const country = $("header #location").data("country");
        const countries = model.getCountriesHolder().get();
        const oldSelectedCountry = model
          .getCountriesHolder()
          .getSelectedCountry();
        let doRedraw = false;
        if (!countries.includes(country)) {
          doRedraw = true;
          const clone = _.cloneDeep(countries);
          clone.push(country);
          model.getCountriesHolder().write(clone);
        }
        const newSelectedCountry = model
          .getCountriesHolder()
          .toggleSelectedCountry(country);
        if (doRedraw || oldSelectedCountry !== newSelectedCountry) {
          redraw(model.getCountriesHolder().get());
        }
      });
    }

    // get the data
    {
      model.fetchData((result) => {
        $("#end").html(result.latest.format("LL"));
        configureStartRangeInput(
          result.earliest.subtract(2, "days"),
          result.latest.subtract(1, "days")
        );
        // $('#startRangeInput').prop("max", result.latest.dayOfYear() - 2);
        // $('#startRangeInput').prop("min", result.earliest.dayOfYear() - 1);

        redraw();
      });
    }
  })();
}); // $(document).ready
