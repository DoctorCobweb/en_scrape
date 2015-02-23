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

//need to access the DOM. => use thenEvaluate() method
casper.thenEvaluate(function () {

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

  var profileId = {
    "All users": "-99",
    "Office Access - Milne EO 1": "4947",
    "Office Access - Bandt 1": "4946",
    "Office Access - Rice 1": "4945",
    "Office Access - Whish-Wilson": "4944",
    "Office Access - Rhiannon 1": "4943",
    "Office Access - Hanson-Young 1": "4942",
    "Office Access - Siewart 1": "4941",
    "Office Access - Waters 1": "4940",
    "Office Access - Di Natale 1": "4939",
    "Office Access - Wright 1": "4938",
    "Office Access - Ludlam 1": "4729",
    "Regional VIC - exploratory CSG licenses": "3730",
    "Western Victoria": "3599",
    "Melbourne Greater Metropolitan Area": "3151",
    "Sydney City": "3144",
    "No State": "1907"
  };

  var officeProfiles = _.keys(profileId);
  var office = profileDetails[1];
  //let officeName = officeProfiles[1]
  var idString = undefined;

  var newItem = document.createElement("LI");
  //newItem.className = 'draggable ea_build_profile_elements_key_color'
  newItem.className = office.className;

  /*
  if (officeName === 'All users') {
    idString = 'available_universe_allUsers_-99'  
  } else {
    idString = `available_universe_profile_${profileId[officeName]}`  
  }
  
  newItem.id = idString
  */
  newItem.id = office.id;
  newItem.style = office.style;
  //newItem.style = 'position: relative; z-index: 0; left: 0px; top: 0px; opacity: 1;'

  var aLink = document.createElement("A");
  aLink.className = "dragLink";
  aLink.style = "cursor:move;";

  var span = document.createElement("SPAN");
  span.className = "imagelinktext";

  //let textNode = document.createTextNode(`${officeName}`)
  var textNode = document.createTextNode("yadda yadda yadda");

  span.appendChild(textNode);
  aLink.appendChild(span);
  newItem.appendChild(aLink);

  var list = document.getElementById("universeSelected");

  // Insert <li> before the first child of <ul>
  list.insertBefore(newItem, list.childNodes[0]);
});

casper.then(function () {
  this.echo("===> clicking RUN");
  this.click("input[name=\"review\"]");
});

casper.then(function () {
  this.echo("===> SHOULD BE REVIEW page. we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());
  //this.echo(this.getPageContent())
  this.click("input[name=\"export\"]");
});

casper.then(function () {
  this.echo("===> clicking OK in add ons...we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());
  this.click("div#exportAddOnsDiv input[value=\"OK\"]");
});

casper.then(function () {
  this.echo("===> SHOULD BE AFTER EXPORTING we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());
  //this.echo(this.getPageContent())
  var text = this.fetchText("table.resultListTable td");
  this.echo(text);
  fs.write("export_jobs.text", text, "w");
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