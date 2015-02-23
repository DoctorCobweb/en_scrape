"use strict";

var andre = {
  name: "andre",
  log: function log() {
    var _this = this;

    //setTimeout(() => {
    //  console.log(this);	
    //}, 1000);
    (function () {
      console.log(_this);
    })();
  }
};

andre.log();