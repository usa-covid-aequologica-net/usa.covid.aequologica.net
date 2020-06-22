'use strict';

import { store } from './yetAnotherLocalStorageWrapper.js';

export function Measure() {

    const defaultMeasureType = "deaths";

    let type = store.get("measureType", defaultMeasureType);

    const typesObject = { confirmed: 0, deaths: 0, recovered: 0 };
    const typesArray = _.map(typesObject, (value, key) => key);

    function getType() {
        return type;
    }

    function setType(newType, nosave) {
        const previousType = type;
        if (!newType || newType === previousType) {
            return;
        }
        switch (newType) {
            case "confirmed":
            case "deaths":
            case "recovered":
                type = newType;
                if (!nosave) {
                    if (type === defaultMeasureType) {
                        store.remove("measureType");
                    } else if (type !== previousType) {
                        store.set("measureType", type);
                    }
                }
                break;
            default:
                break;
        }
    }

    return {
        typesArray: typesArray,
        typesObject: typesObject,
        getType: getType,
        setType: setType,
    }
}
