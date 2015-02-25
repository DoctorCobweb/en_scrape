'use strict';

/*
 * EN SCRAPER
 *
 */


let fs              = require('fs')
let exec            = require('child_process').exec
let request         = require('request')
let csv             = require('csv')
let _               = require('lodash')
let async           = require('async')
let chalk           = require('chalk')
let BOOTH_BASE_NAME = 'ems_polling_booth'
let PRIVATE_DETAILS = '../../.privateDetails.json'
let PROFILE_DETAILS = '../../profileDetails.json'
let DATA_DIR        = '../data/'
let htmlparser      = require('htmlparser2')
let Parser          = require('parse5').Parser
let userEmail
let userPass


fs.readFile(PRIVATE_DETAILS, (err, data) => {
  if (err) throw err

  let pDetails = JSON.parse(data)
  userEmail    = pDetails.userEmail
  userPass     = pDetails.userPass

  //scrapeForAvailableProfiles()
  matchJobsToProfiles() 

})

let scrapeForAvailableProfiles = () => {
  let cmd = 'casperjs --engine=slimerjs '
          + `--userEmail=${userEmail} `
          + `--userPass=${userPass} `
	  + 'enScraper_getProfiles_es6_babelled.js'
   
  console.log(chalk.bgGreen('===> casperjs: enScraper_getProfiles.js'))
  console.log(cmd)

  exec(cmd, {}, (err, stdout, stderr) => {
    if (err) throw err
    console.log('scrapeForAvailableProfiles, in exec callback') 
    console.log(stdout) 
    getProfileDetails()
  })
}

let getProfileDetails = () => {
  fs.readFile(PROFILE_DETAILS, (err, data) => {
    if (err) throw err
    fs.exists(PROFILE_DETAILS, function (exists) {
      if (exists) {
        let pDetails = JSON.parse(data)
        scrapeProfiles(pDetails)
      } else {
        throw new Error('ERROR: profileDetails.json does not exits.') 
      }
    })
  })
}

let makeCasperJob = (entry) => {
  return (cb) => {
    let cmd = 'casperjs --engine=slimerjs '
	    + `--userEmail=${userEmail} `
            + `--userPass=${userPass} `
	    + `--profClassName="${entry[1].className}" `
	    + `--profId=${entry[1].id} `
	    + `--profStyle=${JSON.stringify(entry[1].style)} `
	    + 'enScraper_singleProfile_es6_babelled.js'

    setTimeout( () => {
      console.log(chalk.bgGreen('===> casperjs: enScraper_singleProfile_es6_babelled.js'))
      console.log(cmd)
      exec(cmd, {}, (err, stdout, stderr) => {
        if (err) throw err
        console.log('scrapeProfiles: in exec callback') 
        console.log(stdout) 
        cb(null, stdout)
      })
    }, entry[0] * 3000)
  }
}

let scrapeProfiles = (pDetails) => {
  let jobs = []
  for (let entry of pDetails.entries()) {
    jobs.push(makeCasperJob(entry))
  }
  async.parallel(jobs, (err, results) => {
    if (err) throw err
    console.log('ASYNC PARALLEL DONE: scrapeProfiles export. Need to download still.') 
    //console.log(results) 
    //
    //look at all the export_....txt files to get job numbers for each profile id
    //must ensure that there are correct number of export...txt files corresponding to
    //number of profiles obtained in original scrapeForAvailableProfiles
    matchJobsToProfiles()
  })
}

let matchJobsToProfiles = () => {
  //TODO: further error checking for values in arrays extracted from files.
  fs.readdir(DATA_DIR, (err, files) => {
    if (err) throw err
    if (!files.length) throw new Error('ERROR: DATA_DIR is empty')
    let cleanedInfo =  _.chain(files)
      .reduce((acc, val, idx) => {
        let data = fs.readFileSync(`${DATA_DIR}${val}`, {encoding: 'utf-8'})
        if (!data) throw err
        let info = {}
        info.jobInfo = data,
        info.profileInfo = val
        acc.push(info)
        return acc
       },[])
      .map((val, idx) => {
        let jobArr = val.jobInfo.trim().split(' ')
        let profArr = val.profileInfo.split('_') 
        let cleaned = {}
        cleaned.jobInfo = jobArr[2].slice(1)
        cleaned.profInfo = profArr[profArr.length-2]
        return cleaned
       })
      .values()
      console.log(cleanedInfo)
  })
}





// LATER STUFF
let readScrapeFiles= () => {
  //TODO: loop for all scraped files
  fs.readFile('scrapes/polling_booth_buninyong.txt', {encoding:'utf-8'}, (e, d) => {
    if (e) throw e

    let fData = JSON.parse(d)
    let reduced = _.reduce(fData, (result, row) => {
      let tds = row.html.split('<td')

      if (tds.length === 1) {
        console.log('LENGTH ===1 truw')
      }
      else if (tds.length === 2) {
	//a prepoll row 
	tds.splice(2, 0, '','','','','','','','','','')
	result.push(tds)
      } 
      else if (tds.length === 11){
	//a header row
        tds.splice(2, 0, '')
	result.push(tds)
      }
      else {
	//a normal row
	result.push(tds)
      } 

      return result
    }, [])

    console.log(reduced)
    createTheCsvFile(reduced)
  })
}

let createTheCsvFile = (reduced) => {
  let csvHeader =
    '1'  + '| ' +
    '2'  + '| ' +
    '3'  + '| ' +
    '4'  + '| ' +
    '5'  + '| ' +
    '6'  + '| ' +
    '7'  + '| ' +
    '8'  + '| ' +
    '9'  + '| ' +
    '10' + '| ' +
    '11' + '| ' +
    '12' + '\n'
  let csvContent = csvHeader

  _.forEach(reduced, (item) => {
    csvContent =
         csvContent
      +  item[0]  + '| '  
      +  item[1]  + '| '  
      +  item[2]  + '| '  
      +  item[3]  + '| '  
      +  item[4]  + '| '  
      +  item[5]  + '| '  
      +  item[6]  + '| '  
      +  item[7]  + '| '  
      +  item[8]  + '| '  
      +  item[9]  + '| '  
      +  item[10] + '| '  
      +  item[11] + '\n'  
  })

  fs.writeFile('../../test.csv', csvContent, (err) => {
    if (err) throw err 
    console.log('SUCCESS: save the test.csv to disk')
  })
}
