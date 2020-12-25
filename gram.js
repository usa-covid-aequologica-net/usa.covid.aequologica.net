// https://ohmlang.github.io/
// https://ohmlang.github.io/editor/#

"use strict";

const gram = ohm.grammar(`Test {
  Line = Command | Action 

  Command = Reset
  Action = (Add | Remove) Countries | Select Country
  
  Countries = ALL | Country+ 
  
  ALL = "all"
  Add = "add"
  Remove = "remove"
  Reset = "reset"
  Select = "select"
  
  Country = "Germany" | "South Korea" | "France" | "United States" 
}`);

const process = {
  Line(one) {  
    return one.process();
  },
  Command(one) {
    return {action: one.sourceString.toUpperCase(), argument: null};
  },
  Action(one, two) {  
    return {action: one.sourceString.toUpperCase(), argument: two.process()};
  },
  Country(_) {
    return this.sourceString;
  },
};

const s = gram.createSemantics();

s.addOperation('process', process);

const matchResult0 = gram.match('reset');
const matchResult1 = gram.match('add France Germany');
const matchResult2 = gram.match('remove United States South Korea');
const matchResult3 = gram.match('select France');

console.log(s(matchResult0).process());
console.log(s(matchResult1).process());
console.log(s(matchResult2).process());
console.log(s(matchResult3).process());

export default function Grammar() {
  return {
  };
}
