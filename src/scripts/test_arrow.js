'use strict';

/*
var andre = {
  hi: 'yoyo',
  hello : () => {
    console.log(this.hi);
  }
}; 

andre.hello();
*/

class Person {
  constructor(name){
    this.name = name;
  }

  timers(){
    setTimeout(function(){
      console.log(this.name);     
    }, 100);

    setTimeout(() => {
      console.log(this.name);
    }, 100);
  }
}



let andre = new Person ('andre');
andre.timers();
