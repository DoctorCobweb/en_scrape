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
var async = require("async");
var chalk = require("chalk");
var BOOTH_BASE_NAME = "ems_polling_booth";
var PRIVATE_DETAILS = "../../.privateDetails.json";
var PROFILE_DETAILS = "../../profileDetails.json";
var DATA_DIR = "../data/";
var htmlparser = require("htmlparser2");
var Parser = require("parse5").Parser;
var userEmail = undefined;
var userPass = undefined;

fs.readFile(PRIVATE_DETAILS, function (err, data) {
  if (err) throw err;

  var pDetails = JSON.parse(data);
  userEmail = pDetails.userEmail;
  userPass = pDetails.userPass;

  //scrapeForAvailableProfiles()
  matchJobsToProfiles();
});

var scrapeForAvailableProfiles = function () {
  var cmd = "casperjs --engine=slimerjs " + ("--userEmail=" + userEmail + " ") + ("--userPass=" + userPass + " ") + "enScraper_getProfiles_es6_babelled.js";

  console.log(chalk.bgGreen("===> casperjs: enScraper_getProfiles.js"));
  console.log(cmd);

  exec(cmd, {}, function (err, stdout, stderr) {
    if (err) throw err;
    console.log("scrapeForAvailableProfiles, in exec callback");
    console.log(stdout);
    getProfileDetails();
  });
};

var getProfileDetails = function () {
  fs.readFile(PROFILE_DETAILS, function (err, data) {
    if (err) throw err;
    fs.exists(PROFILE_DETAILS, function (exists) {
      if (exists) {
        var pDetails = JSON.parse(data);
        scrapeProfiles(pDetails);
      } else {
        throw new Error("ERROR: profileDetails.json does not exits.");
      }
    });
  });
};

var makeCasperJob = function (entry) {
  return function (cb) {
    var cmd = "casperjs --engine=slimerjs " + ("--userEmail=" + userEmail + " ") + ("--userPass=" + userPass + " ") + ("--profClassName=\"" + entry[1].className + "\" ") + ("--profId=" + entry[1].id + " ") + ("--profStyle=" + JSON.stringify(entry[1].style) + " ") + "enScraper_singleProfile_es6_babelled.js";

    setTimeout(function () {
      console.log(chalk.bgGreen("===> casperjs: enScraper_singleProfile_es6_babelled.js"));
      console.log(cmd);
      exec(cmd, {}, function (err, stdout, stderr) {
        if (err) throw err;
        console.log("scrapeProfiles: in exec callback");
        console.log(stdout);
        cb(null, stdout);
      });
    }, entry[0] * 3000);
  };
};

var scrapeProfiles = function (pDetails) {
  var jobs = [];
  for (var _iterator = pDetails.entries()[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
    var entry = _step.value;

    jobs.push(makeCasperJob(entry));
  }
  async.parallel(jobs, function (err, results) {
    if (err) throw err;
    console.log("ASYNC PARALLEL DONE: scrapeProfiles export. Need to download still.");
    //console.log(results)
    //
    //look at all the export_....txt files to get job numbers for each profile id
    //must ensure that there are correct number of export...txt files corresponding to
    //number of profiles obtained in original scrapeForAvailableProfiles
    matchJobsToProfiles();
  });
};

var matchJobsToProfiles = function () {
  //TODO: further error checking for values in arrays extracted from files.
  fs.readdir(DATA_DIR, function (err, files) {
    if (err) throw err;
    if (!files.length) throw new Error("ERROR: DATA_DIR is empty");
    var cleanedInfo = _.chain(files).reduce(function (acc, val, idx) {
      var data = fs.readFileSync("" + DATA_DIR + "" + val, { encoding: "utf-8" });
      if (!data) throw err;
      var info = {};
      info.jobInfo = data, info.profileInfo = val;
      acc.push(info);
      return acc;
    }, []).map(function (val, idx) {
      var jobArr = val.jobInfo.trim().split(" ");
      var profArr = val.profileInfo.split("_");
      var cleaned = {};
      cleaned.jobInfo = jobArr[2].slice(1);
      cleaned.profInfo = profArr[profArr.length - 2];
      return cleaned;
    }).values();
    console.log(cleanedInfo);
  });
};

// LATER STUFF
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