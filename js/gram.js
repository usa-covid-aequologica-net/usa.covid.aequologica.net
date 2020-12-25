// https://ohmlang.github.io/
// https://ohmlang.github.io/editor/#

"use strict";

export default function Grammar(countries) {
  
  const formatCountries = '"' + countries.join('" | "') + '"';
  
  const grammarAsAString = `Test {
    Line = Command | Action 
  
    Command = Reset
    Action = (Set | Add | Remove) Countries | Select Country
    
    Countries = All | Country+ 
    
    All = "All" | "all"
    Set = "Set" | "set"
    Add = "Add" | "add" | "Plus" | "plus" | "+"
    Remove = "Remove" | "remove" | "Minus" | "minus" | "-"
    Reset = "Reset" | "reset"
    Select = "Select" | "select" | "Show" | "show" | "To" | "to"
    
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
    processLine: line => {
      const r = g.match(line);
      if (r.failed()) {
        throw "'" + line + "' is not a valid command line";
      }
      if (r.succeeded()) {
        return new Promise(resolve => {
          const result = s(r).process();
          window.ps.publish("COMMAND", result);
          resolve(result);
        });
      }
      throw "Il faut qu'une porte soit ouverte ou fermée. (Alfred de Musset)";
    },
  };
}
