// https://ohmlang.github.io/
// https://ohmlang.github.io/editor/#

"use strict";

import { Fuzzy2Country } from './model/fuzzy.js';

export default function Grammar(countries, onParsed) {

  const countriesExt = Fuzzy2Country().countries;

  const formatCountries = '"' + countriesExt.join('" | "') + '"';

  const grammarAsAString = `CommandInterface {
    Line = Command | Action | Countries
  
    Command = Reset | Clear
    Action = (Set | Add | Remove) Countries | Select Country
    
    Countries = All | Country+ 
    
    All = caseInsensitive<"all">
    Set = caseInsensitive<"set">
    Add = caseInsensitive<"add"> | caseInsensitive<"plus"> | "+"
    Remove = caseInsensitive<"remove"> | caseInsensitive<"minus"> | "-"
    Reset = caseInsensitive<"reset">
    Clear = caseInsensitive<"clear">
    Select = caseInsensitive<"select">
    
    Country = ${formatCountries}
  }`;
  console.log(grammarAsAString);

  const g = ohm.grammar(grammarAsAString);

  const process = {
    Line(one) {
      return one.process();
    },
    Command(one) {
      return { action: one.sourceString.toUpperCase(), argument: null };
    },
    Action(one, two) {
      return {
        action: one.sourceString.toUpperCase(),
        argument: two.process(),
      };
    },
    All(_) {
      return "ALL";
    },
    Country(_) {
      return this.sourceString;
    },
  };

  const s = g.createSemantics();
  s.addOperation("process", process);

  return {
    processLine: (line) => {
      const r = g.match(line);
      if (r.failed()) {
        throw "'" + line + "' is not a valid command line";
      }
      if (r.succeeded()) {
        if (onParsed) onParsed(line);
        return new Promise((resolve) => {
          const resultBeforeMassage = s(r).process();
          let result = undefined;
          if (resultBeforeMassage) {
            if (
              typeof resultBeforeMassage === "string" &&
              resultBeforeMassage === "ALL"
            ) {
              result = { action: "SET", argument: "ALL" };
            } else if (Array.isArray(resultBeforeMassage)) {
              result = { action: "SET", argument: resultBeforeMassage };
            } else {
              result = resultBeforeMassage;
            }
          }
          if (result) window.ps.publish("COMMAND", result);
          resolve(result);
        });
      }
      throw "Il faut qu'une porte soit ouverte ou fermée. (Alfred de Musset)";
    },
  };
}
