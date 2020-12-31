"use strict";

export function Carousel() {
  /*
  const order = [
    { cumula: "total", measure: "confirmed" },
    { cumula: "total", measure: "deaths" },
    { cumula: "daily", measure: "deaths" },
    { cumula: "daily", measure: "confirmed" },
  ];

  function find(c, m) {
    if ((c == "total")) {
      if ((m == "confirmed")) {
        return 0;
      } else {
        return 1;
      }
    } else {
      if ((m == "deaths")) {
        return 2;
      } else {
        return 3;
      }
    }
  }

  function left(c,m) {
    return order[(find(c, m) + order.length - 1) % order.length];
  }
  function right(c,m) {
    return order[(find(c, m) + 1) % order.length];
  }
  */

  return {
    left: (c, m) => c == "total" ? { cumula: "daily", measure: m } : { cumula: "total", measure: m },
    right: (c, m) => m == "confirmed" ? { cumula: c, measure: "deaths" } : { cumula: c, measure: "confirmed" },
  };
}
