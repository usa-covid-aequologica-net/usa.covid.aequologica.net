"use strict";

export default function Neighbours(onSuccess) {

  (function load(then) {
    return $.ajax({
      url: "/data/country_adj_fullname.json",
      type: "GET",
      dataType: "json",
      crossDomain: false,
      success: then,
    });
  })(onSuccess);

  return {
  };
}
