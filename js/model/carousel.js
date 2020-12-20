"use strict";

export function Carousel() {
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

  return {
    left: (c, m) => order[(find(c, m) + order.length - 1) % order.length],
    right: (c, m) => order[(find(c, m) + 1) % order.length],
  };
}
