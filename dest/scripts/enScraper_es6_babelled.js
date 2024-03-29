"use strict";

//'use strict';

var casper = require("casper").create({
  clientScripts: ["../../node_modules/lodash/dist/lodash.min.js", "../../node_modules/jquery/dist/jquery.min.js"] });
var utils = require("utils");
var fs = require("fs"); //fs here is a phantomjs module, not nodejs fs module
var userEmail = casper.cli.get("userEmail");
var userPass = casper.cli.get("userPass");
var boothId = casper.cli.get("boothId");
var district = casper.cli.get("district");
var EN = "https://ww.e-activist.com/ea-account/";
var EN_LOGIN = "" + EN + "index.jsp";
var EN_EXPORT = "" + EN + "auth/selectFilters.jsp?type=user%20data";
var userAgent = "Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0";

casper.start();

casper.open(EN_LOGIN, {
  method: "get",
  headers: {
    "user-agent": userAgent
  }
});

casper.then(function () {
  this.echo("===> we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());

  if (this.exists("form[name=\"accountLF\"]")) {
    this.fillSelectors("form[name=\"accountLF\"]", {
      "input[name=\"_f_0\"]": userEmail,
      "input[name=\"_f_1\"]": userPass
    }, true);
  } else {
    this.echo("ERROR: user login form not found. aborting");
    this.exit();
  }
});

casper.thenOpen(EN_EXPORT, function () {
  this.echo("===> we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());

  if (this.exists("input[name=\"profiles\"]")) {
    this.echo("===> clicking profile button");
    this.click("input[name=\"profiles\"]");
  } else {
    this.echo("ERROR: could not click on profile button. aborting");
    this.exit();
  }
});

casper.then(function () {
  this.echo("===> successfully clicked profile button");
  this.echo("===> attempting to click on select users button");

  if (this.exists("input[name=\"Submit\"]")) {
    this.echo("===> select users button exists. clicking it");
    this.click("input[name=\"Submit\"]");
  } else {
    this.echo("ERROR: could not click on select users buttong. aborting");
    this.exit();
  }
});

var extractProfileInfo = function () {
  //should try to always find all the available profiles to export.
  var profilesDOM = document.querySelectorAll("ul#universeAvailable li");

  var profileDetails = _.reduce(profilesDOM, function (acc, val, idx) {
    var profile = {};
    profile.className = val.className;
    profile.id = val.id;
    profile.style = val.style;
    acc.push(profile);
    return acc;
  }, []);

  return profileDetails;
};

casper.then(function () {
  var profileDetails = this.evaluate(extractProfileInfo);
  fs.write("profileDetails.json", JSON.stringify(profileDetails), "w");

  this.each(profileDetails, function (self, profile) {
    var url = "https://www.e-activist.com/ea-account/auth/selectFilters.jsp?type=user%20data";
    this.thenOpen(url, function () {
      this.echo(this.getCurrentUrl());
      this.echo(this.getTitle());
    });
  });
});

/*
//we should stop here. wait for all the exports to be available.
//
//in index.js wait. then run this in a separate capserjs file.
//reconstruct urls and iterate through something of the form:
casper.then( () => {
  let url = 'https://ww.e-activist.com/ea-account/action.retrievejobresults.do?ea.job.id=212033&jobType=UDX&requestSource=menu'
  this.download(url, 'hello.csv')
})
*/

casper.run();
/*
this.then(function () {
  this.echo(profile.id)
  this.thenEvaluate(function (prof) {
    let office = prof 
    let newItem = document.createElement('LI')
    let aLink = document.createElement('A')
    let span = document.createElement('SPAN')
    let textNode = document.createTextNode(`yadda yadda yadda`) 
    let list = document.getElementById('universeSelected') 
  
    newItem.className = office.className
    newItem.id = office.id
    newItem.style = office.style
    aLink.className = 'dragLink'
    aLink.style = 'cursor:move;'
    span.className = 'imagelinktext'
  
    span.appendChild(textNode)
    aLink.appendChild(span)
    newItem.appendChild(aLink)
  
    // Insert <li> before the first child of <ul>
    list.insertBefore(newItem, list.childNodes[0])   
    
  }, profile)
   this.then(function () {
    this.echo('===> clicking RUN')
    this.click('input[name="review"]')
  })
  this.then(function () {
    this.echo('===> SHOULD BE REVIEW page. we are at webpage:')
    this.echo(this.getCurrentUrl())
    this.echo(this.getTitle())
    //this.echo(this.getPageContent())
    this.click('input[name="export"]')
  })
  this.then(function () {
    this.echo('===> clicking OK in add ons...we are at webpage:')
    this.echo(this.getCurrentUrl())
    this.echo(this.getTitle())
    this.click('div#exportAddOnsDiv input[value="OK"]')
  })
  this.then(function () {
    this.echo('===> SHOULD BE AFTER EXPORTING we are at webpage:')
    this.echo(this.getCurrentUrl())
    this.echo(this.getTitle())
    //this.echo(this.getPageContent())
    let text = this.fetchText('table.resultListTable td')
    this.echo(text)
    fs.write('export_jobs.text', text, 'w')
  })
  })
*/