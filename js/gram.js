// https://ohmlang.github.io/
// https://ohmlang.github.io/editor/#

"use strict";

export default function Grammar(countries) {
  
  const formatCountries = '"' + countries.join('" | "') + '"';
  
  const grammarAsString = `Test {
    Line = Command | Action 
  
    Command = Reset
    Action = (Set | Add | Remove) Countries | Select Country
    
    Countries = ALL | Country+ 
    
    ALL = "All" | "all"
    Set = "Set" | "set"
    Add = "Add" | "add" | "Plus" | "plus" 
    Remove = "Remove" | "remove" | "Minus" | "minus"
    Reset = "Reset" | "reset"
    Select = "Select" | "select" | "Show" | "show" | "To" | "to"
    
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
        window.ps.publish("COMMAND", result);
        return result;
      }
      return "Il faut qu'une porte soit ouverte ou fermée. (Alfred de Musset)";
    },
  };
}