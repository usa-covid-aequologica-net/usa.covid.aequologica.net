'use strict';

export function Measure(window) {

    const defaultType = "deaths";

    let type = defaultType;

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
                    type = defaultType;
                    break;
            }
            if (!nosave) {
                if (type === defaultType) {
                    window._localStorage.removeItem("measureType");
                    console.log("remove type from local storage");
                } else if (type !== previousType) {
                    window._localStorage.setItem("measureType", type);
                    console.log("write type to local storage", type);
                }
            }
        }
    }

    // read type from local storage 
    let typeFromLocalStorage = window._localStorage.getItem("measureType");
    if (typeFromLocalStorage) {
        setType(typeFromLocalStorage);
        console.log("measure type = " + typeFromLocalStorage + " from local storage");
    } else {
        console.log("measure type = " + type + " from defaults");
    }

    return {
        typesArray: typesArray,
        typesObject: typesObject,
        getType: getType,
        setType: setType,
    }
}
