"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/*
var andre = {
  hi: 'yoyo',
  hello : () => {
    console.log(this.hi);
  }
}; 

andre.hello();
*/

var Person = (function () {
  function Person(name) {
    _classCallCheck(this, Person);

    this.name = name;
  }

  _prototypeProperties(Person, null, {
    timers: {
      value: function timers() {
        var _this = this;

        setTimeout(function () {
          console.log(this.name);
        }, 100);

        setTimeout(function () {
          console.log(_this.name);
        }, 100);
      },
      writable: true,
      configurable: true
    }
  });

  return Person;
})();

var andre = new Person("andre");
andre.timers();