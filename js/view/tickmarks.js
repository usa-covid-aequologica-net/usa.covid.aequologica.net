"use strict";

export function tickmarks(redraw, idX, getX, setX, codec, display) {
  const X = getX();
  const $rangeControl = $(idX + '[type="range"]');
  $rangeControl.val(codec.encode(X));
  function feedback(a) {
    const $qwe = display(a);
    $(idX + "Label").empty().append($qwe);
  }
  feedback(X);
  $rangeControl.each((i, r) => {
    r.addEventListener("input", () => {
      const decoded = codec.decode(r.value);
      feedback(decoded);
    });
    r.addEventListener("change", () => {
      const decoded = codec.decode(r.value);
      if (getX() != decoded) {
        setX(decoded);
        feedback(decoded);
        redraw();
      }
    });
  });
}
