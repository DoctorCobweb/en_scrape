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
var PROFILE_DETAILS = "../data/profileDetails.json";
var DATA_DIR = "../data/";
var EN_GET_PROFILES = "enScraper_getProfiles_es6_babelled.js";
var EN_SINGLE_PROFILES = "enScraper_singleProfile_es6_babelled.js";
var EN_DL_PROFILES = "enScraper_downloadProfile_es6_babelled.js";

var enAccountDetails = function (cb) {
  fs.readFile(PRIVATE_DETAILS, function (err, data) {
    if (err) throw err;
    var pDetails = JSON.parse(data);
    var obj = {};
    obj.userEmail = pDetails.userEmail;
    obj.userPass = pDetails.userPass;
    cb(null, obj);
  });
};

var rmDataExportDir = function (cb) {
  fs.rmdir("" + DATA_DIR + "exportInfo", function (err) {
    if (err) cb(err, null);
    cb(null, "rm data/exportInfo dir");
  });
};

var rmDataDir = function (cb) {
  fs.rmdir(DATA_DIR, function (err) {
    if (err) cb(err, null);
    cb(null, "rm data dir");
  });
};

var makeDataDir = function (cb) {
  fs.mkdir(DATA_DIR, function (err) {
    if (err) cb(err, null);
    cb(null, "made data dir");
  });
};

var makeExportInfoDir = function (cb) {
  fs.mkdir("" + DATA_DIR + "exportInfo", function (err) {
    if (err) cb(err, null);
    cb(null, "made data/exportInfo dir");
  });
};

var init = (function () {
  console.log("init");
  var setup = [enAccountDetails, rmDataExportDir, rmDataDir, makeDataDir, makeExportInfoDir];

  async.series(setup, function (err, data) {
    if (err) throw err;
    scrapeForAvailableProfiles(data[0]);
    //matchJobsToProfiles(data[0])
    console.log("start success.");
    console.log(data);
  });
})();

var scrapeForAvailableProfiles = function (uDetails) {
  var cmd = "casperjs --engine=slimerjs " + ("--userEmail=" + uDetails.userEmail + " ") + ("--userPass=" + uDetails.userPass + " ") + EN_GET_PROFILES;
  console.log(chalk.bgGreen("===> casperjs: " + EN_GET_PROFILES));
  console.log(cmd);
  exec(cmd, {}, function (err, stdout, stderr) {
    if (err) throw err;
    console.log("scrapeForAvailableProfiles, in exec callback");
    console.log(stdout);
    getProfileDetails(uDetails);
  });
};

var getProfileDetails = function (uDetails) {
  fs.readFile(PROFILE_DETAILS, function (err, data) {
    if (err) throw err;
    fs.exists(PROFILE_DETAILS, function (exists) {
      if (exists) {
        var pDetails = JSON.parse(data);
        scrapeProfiles(pDetails, uDetails);
      } else {
        throw new Error("ERROR: profileDetails.json does not exits.");
      }
    });
  });
};

var makeCasperJob = function (clargs, scriptName) {
  return function (cb) {
    var cmd = "casperjs --engine=slimerjs " + clargs.join(" ") + " " + scriptName;
    setTimeout(function () {
      console.log(chalk.bgGreen("===> casperjs: " + scriptName));
      console.log(cmd);
      exec(cmd, {}, function (err, stdout, stderr) {
        if (err) throw err;
        console.log("in exec callback for " + scriptName);
        console.log(stdout);
        cb(null, stdout);
      });
    }, Math.floor(Math.random() * 11) * 10000);
  };
};

var scrapeProfiles = function (pDetails, uDetails) {
  var jobs = [];
  for (var _iterator = pDetails.entries()[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
    var entry = _step.value;

    var clargs = [];
    console.log(entry);
    clargs.push("--userEmail=" + uDetails.userEmail);
    clargs.push("--userPass=" + uDetails.userPass);
    clargs.push("--profName=\"" + entry[1].profName + "\"");
    clargs.push("--profClassName=\"" + entry[1].className + "\"");
    clargs.push("--profId=" + entry[1].id);
    clargs.push("--profStyle=" + JSON.stringify(entry[1].style));
    jobs.push(makeCasperJob(clargs, EN_SINGLE_PROFILES));
  }
  async.parallel(jobs, function (err, results) {
    if (err) throw err;
    console.log("ASYNC PARALLEL DONE: scrapeProfiles export. Need to download still.");
    //console.log(results)
    //
    //look at all the export_....txt files to get job numbers for each profile id
    //must ensure that there are correct number of export...txt files corresponding to
    //number of profiles obtained in original scrapeForAvailableProfiles
    //
    matchJobsToProfiles(uDetails);
  });
};

var matchJobsToProfiles = function (uDetails) {
  //TODO: further error checking for values in arrays extracted from files.
  fs.readdir("" + DATA_DIR + "exportInfo", function (err, files) {
    if (err) throw err;
    if (!files.length) throw new Error("ERROR: " + DATA_DIR + "exportInfo is empty");
    var cleanedInfo = _.chain(files).reduce(function (acc, val, idx) {
      var data = fs.readFileSync("" + DATA_DIR + "exportInfo/" + val, { encoding: "utf-8" });

      if (!data) throw err;
      var obj = {};
      obj.jobInfo = data, obj.profileInfo = val;
      acc.push(obj);
      return acc;
    }, []).map(function (val, idx) {
      var jobArr = val.jobInfo.trim().split(" ");
      //let profArr0 = val.profileInfo.split('_')
      //profileInfo is of form 'export_***available_universe_profile_1234***_###Scott@@@Ludlam@@@Profile@@@1@@@###.txt'
      console.log("val is " + val);
      console.log("val.profileInfo is " + val.profileInfo);
      var profArr1 = val.profileInfo.split("***");
      var profArr1_1 = profArr1[1].split("_");
      var profArr2 = val.profileInfo.split("###");
      var c = {};
      c.jobId = jobArr[2].slice(1);
      c.profId = profArr1_1[profArr1_1.length - 1];
      c.profName = profArr2[profArr2.length - 2].split("@@@").join(" ");
      return c;
    }).values().__wrapped__;
    console.log(JSON.stringify(cleanedInfo));
    //
    //wait for a default 5minutes for all export profiles to be available
    console.log(chalk.bgRed("SLEEP FOR 5 MINS: wait for exports to be downloadable."));
    setTimeout(function () {
      //TODO: check to see if all downloads are actually avail/complete before
      //calling thru to eachProfileData func.
      eachProfileData(cleanedInfo, uDetails);
    }, 5 * 60 * 1000);
  });
};

var eachProfileData = function (cInfo, uDetails) {
  var jobs = [];
  for (var _iterator = cInfo[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
    var entry = _step.value;

    var clargs = [];
    clargs.push("--userEmail=" + uDetails.userEmail);
    clargs.push("--userPass=" + uDetails.userPass);
    clargs.push("--enJobId=" + entry.jobId);
    clargs.push("--enProfId=" + entry.profId);
    jobs.push(makeCasperJob(clargs, EN_DL_PROFILES));
  }
  //finally download records for each profile
  async.parallel(jobs, function (err, results) {
    if (err) throw err;
    console.log("ASYNC PARALLEL DONE: profiles should be downloading now or dld??!!.");
    //console.log(results)
    /*
    setTimeout(function () {
      console.log(chalk.bgGreen('SLEEP FOR 45 MINS: wait for downloads to finish.'))
      updateProfiles(cInfo, uDetails)
    }, 45 * 60 * 1000)
    */
    updateProfiles(cInfo, uDetails);
  });
};

var updateProfiles = function (cInfo, uDetails) {
  //TODO: check to see if all files have finished downloading
  console.log(chalk.bgBlue("updating all the profiles."));
  fs.readdir(DATA_DIR, function (err, files) {
    if (err) throw err;
    if (!files.length) throw new Error("ERROR: " + DATA_DIR + " is empty so no csv files");
    var csvExportFileNames = _.filter(files, function (file) {
      return /.csv$/.test(file) && /^profileId/.test(file);
    });

    _.forEach(csvExportFileNames, function (file) {
      //TODO: don't rely on hardcoded indices, filename pattern
      var fComps = file.split("_");
      var fDetails = {};
      fDetails[fComps[0]] = fComps[1];
      fDetails[fComps[2]] = fComps[3];
      fDetails.profName = _.result(_.find(cInfo, function (profile) {
        return profile.profId === fComps[1];
      }), "profName");
      console.dir("updating profile for " + fComps);
      console.dir("updating profile with " + JSON.stringify(fDetails));
      updateSingleProfile(file, fDetails, uDetails);
    });
  });
};

var updateSingleProfile = function (file, fDetails, uDetails) {
  var parsedHeader = false;
  var officeAccessIdx = undefined;
  fs.createReadStream("" + DATA_DIR + "" + file, { encoding: "utf8" }).pipe(csv.parse({ delimiter: "," })).pipe(csv.transform(function (record) {
    try {
      if (_.indexOf(record, "Office Access") !== -1 && _.indexOf(record, "Date Created") !== -1 && _.indexOf(record, "Date Modified") !== -1 && _.indexOf(record, "CiviID") !== -1 && _.indexOf(record, "Address 1") !== -1 && _.indexOf(record, "MP Subscription") !== -1) {
        parsedHeader = true;
        officeAccessIdx = _.indexOf(record, "Office Access");
        return record;
      } else {
        if (parsedHeader && officeAccessIdx !== -1) {
          //record[officeAccessIdx] = fDetails.profileId
          record[officeAccessIdx] = fDetails.profName;
          return record;
        } else {
          console.log("WEIRD ERROR!!!!: " + officeAccessIdx);
          //TODO: weird code area. parsedHeader but no Office Access header field
          return record;
        }
      }
    } catch (e) {
      throw new Error(e);
    }
  })).pipe(csv.stringify()).pipe(fs.createWriteStream("" + DATA_DIR + "updated_" + file), { encoding: "utf8" });
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