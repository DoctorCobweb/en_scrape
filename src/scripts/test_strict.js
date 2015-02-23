'use strict';

var andre = {
  name : 'andre',
  log : function () {
    //setTimeout(() => {
    //  console.log(this);	
    //}, 1000);
    () => {
      console.log(this);	
    }()
  }
}

andre.log();
