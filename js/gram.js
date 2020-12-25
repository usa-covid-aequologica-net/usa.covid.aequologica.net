// https://ohmlang.github.io/
// https://ohmlang.github.io/editor/#

"use strict";

export default function Grammar(countries) {
  const formatCountries = '"' + countries.join('" | "') + '"';
  const grammarAsString = `Test {
    Line = Countries | Command | Action 
  
    Command = Reset
    Action = (Add | Remove) Countries | Select Country
    
    Countries = ALL | Country+ 
    
    ALL = "all" | "All"
    Add = "Add" | "add" | "Plus" | "plus" 
    Remove = "Remove" | "remove" | "Minus" | "minus"
    Reset = "reset"
    Select = "select"
    
    Country = ${formatCountries}
  }`;
  console.log(grammarAsString);
  const g = ohm.grammar(grammarAsString);

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
    ALL(_) {
      return "ALL";
    },
    Country(_) {
      return this.sourceString;
    },
  };

  const s = g.createSemantics();

  s.addOperation("process", process);

  return {
    process: (line) => {
      const r = g.match(line);
      if (r.failed()) {
        throw "cannot parse |" + line + "|";
      }
      if (r.succeeded()) {
        const result = s(r).process();
        if (Array.isArray(result)) { // array of countries
          window.ps.publish("COMMAND", { action: "SET", argument: result });
        } else if (typeof result === "string" && result === "ALL") { // ALL
          window.ps.publish("COMMAND", { action: "SET", argument: result });
        } else if (typeof result === 'object') { // object
          window.ps.publish("COMMAND", result);
        }
        return result;
      }
      return "Il faut qu'une porte soit ouverte ou fermée. (Alfred de Musset)";
    },
  };
}
