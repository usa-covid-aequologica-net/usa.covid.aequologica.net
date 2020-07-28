'use strict';

import { store } from './yetAnotherLocalStorageWrapper.js';

export function Measure() {

    const defaultMeasureType = "confirmed";

    let type = store.get("measureType", defaultMeasureType);

    const typesArray = ["confirmed", "deaths", "recovered"];
    const typesObject = { confirmed: 0, deaths: 0, recovered: 0 };

    function getType() {
        return type;
    }

    function setType(newType, nosave) {
        const previousType = type;
        if (newType && newType !== previousType) {
            switch (newType) {
                case "confirmed":
                case "deaths":
                case "recovered":
                    type = newType;
                    break;
                default:
                    break;
            }
            if (!nosave) {
                if (type === defaultMeasureType) {
                    store.remove("measureType");
                } else if (type !== previousType) {
                    store.set("measureType", type);
                }
            }
        }
    }

    return {
        typesArray: typesArray,
        typesObject: typesObject,
        getType: getType,
        setType: setType,
    }
}
