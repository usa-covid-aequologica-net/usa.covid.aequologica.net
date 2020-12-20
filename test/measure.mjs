'use strict';

/* 
READ 
https://stackoverflow.com/a/60522428/1070215 
https://mochajs.org/#nodejs-native-esm-support
*/

import assert from 'assert';

import { Measure } from '../js/model/measure.js';

const measure = new Measure();

describe('measure', function () {

  it('default measure type is "deaths"', function () {
    assert.equal(measure.getType(), "deaths");
  });
  it('set correct measure type has some effect', function () {
    measure.setType("confirmed");
    assert.equal(measure.getType(), "confirmed");
  });
  it('set wrong measure type has no effect', function () {
    measure.setType("confirmed");
    measure.setType("dugenou");
    assert.equal(measure.getType(), "confirmed");
  });
  it('measure type is persisted', function () {
    assert.equal(measure.getType(), "confirmed");
  });
  it('valid array of measure types is [ "confirmed", "deaths"]', function () {
    assert.deepEqual(measure.typesArray, ["confirmed", "deaths"]);
  });
  it('valid measure types object is { confirmed: 0, deaths: 0  }', function () {
    assert.deepEqual(measure.typesObject, { confirmed: 0, deaths: 0 });
  });

});
