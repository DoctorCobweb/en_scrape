"use strict";

//'use strict';

var casper = require("casper").create({
  clientScripts: ["../../node_modules/lodash/dist/lodash.min.js", "../../node_modules/jquery/dist/jquery.min.js"] });
var utils = require("utils");
var fs = require("fs"); //fs here is a phantomjs module, not nodejs fs module
var userEmail = casper.cli.get("userEmail");
var userPass = casper.cli.get("userPass");
var profClassName = casper.cli.get("profClassName");
var profId = casper.cli.get("profId");
var profStyle = casper.cli.get("profStyle");
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

casper.thenEvaluate(function (profClassName, profId, profStyle) {
  var newItem = document.createElement("LI");
  var aLink = document.createElement("A");
  var span = document.createElement("SPAN");
  var textNode = document.createTextNode("yadda yadda yadda");
  var list = document.getElementById("universeSelected");
  newItem.className = profClassName;
  newItem.id = profId;
  newItem.style = profStyle;
  aLink.className = "dragLink";
  aLink.style = "cursor:move;";
  span.className = "imagelinktext";
  span.appendChild(textNode);
  aLink.appendChild(span);
  newItem.appendChild(aLink);
  // Insert <li> before the first child of <ul>
  list.insertBefore(newItem, list.childNodes[0]);
}, profClassName, profId, profStyle);

casper.then(function () {
  this.echo("===> clicking RUN");
  this.click("input[name=\"review\"]");
});

casper.then(function () {
  this.echo("===> SHOULD BE REVIEW page. we are at webpage:");
  this.echo(this.getCurrentUrl());
  this.echo(this.getTitle());
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
  fs.write("../data/export_" + profId + "_" + new Date().toJSON() + ".txt", text, "w");
});

casper.run();