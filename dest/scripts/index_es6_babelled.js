"use strict";

/*
 * EN SCRAPER
 *
 */

var fs = require("fs");
var exec = require("child_process").exec;
var request = require("request");
var csv = require("csv");
var _ = require("lodash");
var chalk = require("chalk");
var BOOTH_BASE_NAME = "ems_polling_booth";
var PRIVATE_DETAILS = "../../.privateDetails.json";
var htmlparser = require("htmlparser2");
var Parser = require("parse5").Parser;
var userEmail = undefined;
var userPass = undefined;

fs.readFile(PRIVATE_DETAILS, function (err, data) {
  if (err) throw err;

  var pDetails = JSON.parse(data);
  userEmail = pDetails.userEmail;
  userPass = pDetails.userPass;

  scraperBegin();
});

var scraperBegin = function () {
  var districts = {
    buninyong: "1465" };

  _.forEach(districts, function (val, key) {
    var cmd = "casperjs --engine=slimerjs " + ("--userEmail=" + userEmail + " ") + ("--userPass=" + userPass + " ") + ("--boothId=" + val + " ") + ("--district=" + key + " ") + "enScraper_es6_babelled.js";

    console.log(chalk.bgGreen("===> calling enScraper.js using casperjs"));
    console.log(cmd);

    beginAScrape(cmd);
  });
};

var beginAScrape = function (cmd) {

  exec(cmd, {}, function (err, stdout, stderr) {
    if (err) throw err;
    console.log("in exec callback");
    console.log(stdout);
  });
};

var readScrapeFiles = function () {

  //TODO: loop for all scraped files
  fs.readFile("scrapes/polling_booth_buninyong.txt", { encoding: "utf-8" }, function (e, d) {
    if (e) throw e;

    var fData = JSON.parse(d);
    var reduced = _.reduce(fData, function (result, row) {
      var tds = row.html.split("<td");

      if (tds.length === 1) {
        console.log("LENGTH ===1 truw");
      } else if (tds.length === 2) {
        //a prepoll row
        tds.splice(2, 0, "", "", "", "", "", "", "", "", "", "");
        result.push(tds);
      } else if (tds.length === 11) {
        //a header row
        tds.splice(2, 0, "");
        result.push(tds);
      } else {
        //a normal row
        result.push(tds);
      }

      return result;
    }, []);

    console.log(reduced);
    createTheCsvFile(reduced);
  });
};

var createTheCsvFile = function (reduced) {
  var csvHeader = "1" + "| " + "2" + "| " + "3" + "| " + "4" + "| " + "5" + "| " + "6" + "| " + "7" + "| " + "8" + "| " + "9" + "| " + "10" + "| " + "11" + "| " + "12" + "\n";
  var csvContent = csvHeader;

  _.forEach(reduced, function (item) {
    csvContent = csvContent + item[0] + "| " + item[1] + "| " + item[2] + "| " + item[3] + "| " + item[4] + "| " + item[5] + "| " + item[6] + "| " + item[7] + "| " + item[8] + "| " + item[9] + "| " + item[10] + "| " + item[11] + "\n";
  });

  fs.writeFile("../../test.csv", csvContent, function (err) {
    if (err) throw err;
    console.log("SUCCESS: save the test.csv to disk");
  });
};
//readScrapeFiles()

//'bellarine'      : '1454',
//'melton'         : '1497',
//'polwath'        : '1516',
//'lowan'          : '1493',
//'geelong'        : '1482',
//'lara'           : '1492',
//'ripon'          : '1521',
//'southbarwon'    : '1525',
//'southwestcoast' : '1526',
//'wendouree'      : '1533'