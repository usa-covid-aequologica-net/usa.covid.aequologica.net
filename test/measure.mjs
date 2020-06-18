'use strict';

/* 
READ 
https://stackoverflow.com/a/60522428/1070215 
https://mochajs.org/#nodejs-native-esm-support
*/

import assert from 'assert';

import { Measure } from '../js/model/measure.js';
import { window } from './poorManSLocalStorage.mjs';

const measure = new Measure(window);

describe('Measure', function () {

  describe('validate', function () {

    it('default measure type is "deaths"', function () {
      assert.equal(measure.getType(), "deaths");
    });
    it('set wrong measure type has no effect', function () {
      measure.setType("dugenou");
      assert.equal(measure.getType(), "deaths");
    });
    it('set correct measure type has some effect', function () {
      measure.setType("confirmed");
      assert.equal(measure.getType(), "confirmed");
    });
    it('measure type is persisted', function () {
      assert.equal(measure.getType(), "confirmed");
    });
    it('valid measure types array is [ "confirmed", "deaths", "recovered" ]', function () {
      assert.deepEqual(measure.typesArray, ["confirmed", "deaths", "recovered"]);
    });
    it('valid measure types object is { confirmed: 0, deaths: 0, recovered: 0 }', function () {
      assert.deepEqual(measure.typesObject, { confirmed: 0, deaths: 0, recovered: 0 });
    });
    
  });
});
