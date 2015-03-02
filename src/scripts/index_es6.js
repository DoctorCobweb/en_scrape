'use strict';

/*
 * EN SCRAPER
 *
 */


let fs = require('fs')
let exec = require('child_process').exec
let request = require('request')
let csv = require('csv')
let _ = require('lodash')
let async = require('async')
let chalk = require('chalk')
const BOOTH_BASE_NAME = 'ems_polling_booth'
const PRIVATE_DETAILS = '../../.privateDetails.json'
const PROFILE_DETAILS = '../data/profileDetails.json'
const DATA_DIR = '../data/'
const EN_GET_PROFILES = 'enScraper_getProfiles_es6_babelled.js'
const EN_SINGLE_PROFILES = 'enScraper_singleProfile_es6_babelled.js'
const EN_DL_PROFILES = 'enScraper_downloadProfile_es6_babelled.js'

let enAccountDetails = (cb) => {
  fs.readFile(PRIVATE_DETAILS, (err, data) => {
    if (err) throw err
    let pDetails = JSON.parse(data)
    let obj = {}
    obj.userEmail = pDetails.userEmail
    obj.userPass = pDetails.userPass
    cb(null, obj) 
  })
}

let rmDataExportDir = (cb) => {
  fs.rmdir(`${DATA_DIR}exportInfo`, (err) => {
    if (err)  cb(err, null)
    cb(null, 'rm data/exportInfo dir')
  }) 
}

let rmDataDir = (cb) => {
  fs.rmdir(DATA_DIR, (err) => {
    if (err)  cb(err, null)
    cb(null, 'rm data dir')
  }) 
}

let makeDataDir = (cb) => {
  fs.mkdir(DATA_DIR, (err) => {
    if (err)  cb(err, null)
    cb(null, 'made data dir')
  }) 
}

let makeExportInfoDir = (cb) => {
  fs.mkdir(`${DATA_DIR}exportInfo`, (err) => {
    if (err)  cb(err, null)
    cb(null, 'made data/exportInfo dir')
  }) 
}

let init = (() => {
  console.log('init')
  let setup = [enAccountDetails,
               rmDataExportDir,
               rmDataDir, 
               makeDataDir, 
               makeExportInfoDir]

  async.series(setup, (err, data) => {
    if (err) throw err
      scrapeForAvailableProfiles(data[0])
      //matchJobsToProfiles(data[0]) 
      console.log('start success.')
      console.log(data)
  })
})()

let scrapeForAvailableProfiles = (uDetails) => {
  let cmd = 'casperjs --engine=slimerjs '
          + `--userEmail=${uDetails.userEmail} `
          + `--userPass=${uDetails.userPass} `
	  + EN_GET_PROFILES
  console.log(chalk.bgGreen(`===> casperjs: ${EN_GET_PROFILES}`))
  console.log(cmd)
  exec(cmd, {}, (err, stdout, stderr) => {
    if (err) throw err
    console.log('scrapeForAvailableProfiles, in exec callback') 
    console.log(stdout) 
    getProfileDetails(uDetails)
  })
}

let getProfileDetails = (uDetails) => {
  fs.readFile(PROFILE_DETAILS, (err, data) => {
    if (err) throw err
    fs.exists(PROFILE_DETAILS, function (exists) {
      if (exists) {
        let pDetails = JSON.parse(data)
        scrapeProfiles(pDetails, uDetails)
      } else {
        throw new Error('ERROR: profileDetails.json does not exits.') 
      }
    })
  })
}

let makeCasperJob = (clargs, scriptName) => {
  return (cb) => {
    let cmd = 'casperjs --engine=slimerjs '
	    + clargs.join(' ') + ' '
	    + scriptName
    setTimeout( () => {
      console.log(chalk.bgGreen(`===> casperjs: ${scriptName}`))
      console.log(cmd)
      exec(cmd, {}, (err, stdout, stderr) => {
        if (err) throw err
        console.log(`in exec callback for ${scriptName}`) 
        console.log(stdout) 
        cb(null, stdout)
      })
    }, Math.floor(Math.random() * 11) * 10000)
  }
}

let scrapeProfiles = (pDetails, uDetails) => {
  let jobs = []
  for (let entry of pDetails.entries()) {
    let clargs = [] 
    console.log(entry)
    clargs.push(`--userEmail=${uDetails.userEmail}`)
    clargs.push(`--userPass=${uDetails.userPass}`)
    clargs.push(`--profName="${entry[1].profName}"`)
    clargs.push(`--profClassName="${entry[1].className}"`)
    clargs.push(`--profId=${entry[1].id}`)
    clargs.push(`--profStyle=${JSON.stringify(entry[1].style)}`)
    jobs.push(makeCasperJob(clargs, EN_SINGLE_PROFILES))
  }
  async.parallel(jobs, (err, results) => {
    if (err) throw err
    console.log('ASYNC PARALLEL DONE: scrapeProfiles export. Need to download still.') 
    //console.log(results) 
    //
    //look at all the export_....txt files to get job numbers for each profile id
    //must ensure that there are correct number of export...txt files corresponding to
    //number of profiles obtained in original scrapeForAvailableProfiles
    //
    matchJobsToProfiles(uDetails)
  })
}

let matchJobsToProfiles = (uDetails) => {
  //TODO: further error checking for values in arrays extracted from files.
  fs.readdir(`${DATA_DIR}exportInfo`, (err, files) => {
    if (err) throw err
    if (!files.length) throw new Error(`ERROR: ${DATA_DIR}exportInfo is empty`)
    let cleanedInfo =  _.chain(files)
      .reduce( (acc, val, idx) => {
        let data = fs.readFileSync(`${DATA_DIR}exportInfo/${val}`, {encoding: 'utf-8'})

        if (!data) throw err
        let obj = {}
        obj.jobInfo = data,
        obj.profileInfo = val
        acc.push(obj)
        return acc
       },[])
      .map( (val, idx) => {
        let jobArr = val.jobInfo.trim().split(' ')
        //let profArr0 = val.profileInfo.split('_') 
	//profileInfo is of form 'export_***available_universe_profile_1234***_###Scott@@@Ludlam@@@Profile@@@1@@@###.txt'
	console.log(`val is ${val}`)
	console.log(`val.profileInfo is ${val.profileInfo}`)
        let profArr1 = val.profileInfo.split('***') 
	let profArr1_1 = profArr1[1].split('_')
	let profArr2 = val.profileInfo.split('###')
        let c = {}
        c.jobId = jobArr[2].slice(1)
        c.profId = profArr1_1[profArr1_1.length - 1]
        c.profName = profArr2[profArr2.length - 2].split('@@@').join(' ')
        return c
       })
      .values().__wrapped__
      console.log(JSON.stringify(cleanedInfo))
      //
      //wait for a default 5minutes for all export profiles to be available
      console.log(chalk.bgRed('SLEEP FOR 5 MINS: wait for exports to be downloadable.'))
      setTimeout(function () {
	//TODO: check to see if all downloads are actually avail/complete before 
	//calling thru to eachProfileData func.
        eachProfileData(cleanedInfo, uDetails)
      }, 5 * 60 * 1000)
  })
}

let eachProfileData = (cInfo, uDetails) => {
  let jobs = []
  for (let entry of cInfo) {
    let clargs = []
    clargs.push(`--userEmail=${uDetails.userEmail}`)
    clargs.push(`--userPass=${uDetails.userPass}`)
    clargs.push(`--enJobId=${entry.jobId}`)
    clargs.push(`--enProfId=${entry.profId}`)
    jobs.push(makeCasperJob(clargs, EN_DL_PROFILES))
  }
  //finally download records for each profile
  async.parallel(jobs, (err, results) => {
    if (err) throw err
    console.log('ASYNC PARALLEL DONE: profiles should be downloading now or dld??!!.') 
    //console.log(results) 
    /*
    setTimeout(function () {
      console.log(chalk.bgGreen('SLEEP FOR 45 MINS: wait for downloads to finish.'))
      updateProfiles(cInfo, uDetails)
    }, 45 * 60 * 1000)
    */
    updateProfiles(cInfo, uDetails)
  })
}

let updateProfiles = (cInfo, uDetails) => {
  //TODO: check to see if all files have finished downloading
  console.log(chalk.bgBlue('updating all the profiles.')) 
  fs.readdir(DATA_DIR, (err, files) => {
    if (err) throw err
    if (!files.length) throw new Error(`ERROR: ${DATA_DIR} is empty so no csv files`)
    let csvExportFileNames = _.filter(files, (file) => {
      return (/.csv$/.test(file) && /^profileId/.test(file))
    }) 

    _.forEach(csvExportFileNames, (file) => {
      //TODO: don't rely on hardcoded indices, filename pattern
      let fComps = file.split('_')
      let fDetails = {}
      fDetails[fComps[0]] = fComps[1]
      fDetails[fComps[2]] = fComps[3]
      fDetails.profName = _.result(_.find(cInfo, (profile) => {
        return profile.profId === fComps[1] 
      }), 'profName')
      console.dir(`updating profile for ${fComps}`)
      console.dir(`updating profile with ${JSON.stringify(fDetails)}`)
      updateSingleProfile(file, fDetails, uDetails)  
    })
  }) 
}

let updateSingleProfile = (file, fDetails, uDetails) => {
  let parsedHeader = false
  let officeAccessIdx
  fs.createReadStream(`${DATA_DIR}${file}`, {encoding: 'utf8'})
    .pipe(csv.parse({delimiter: ','}))
    .pipe(csv.transform((record) => {
      try {
        if ((_.indexOf(record, 'Office Access') !== -1) &&
	    (_.indexOf(record, 'Date Created') !== -1) &&
	    (_.indexOf(record, 'Date Modified') !== -1) &&
	    (_.indexOf(record, 'CiviID') !== -1) &&
	    (_.indexOf(record, 'Address 1') !== -1) &&
	    (_.indexOf(record, 'MP Subscription') !== -1)
	    ) 
	{
          parsedHeader = true 
	  officeAccessIdx = _.indexOf(record, 'Office Access')
	  return record
	} else {
          if (parsedHeader && (officeAccessIdx !== -1)) {
            //record[officeAccessIdx] = fDetails.profileId
            record[officeAccessIdx] = fDetails.profName
            return record	
	  } else {
	    console.log('WEIRD ERROR!!!!: ' + officeAccessIdx)
            //TODO: weird code area. parsedHeader but no Office Access header field
	    return record 
	  }
	}	
      } catch (e) {
        throw new Error(e)
      }
    }))
    .pipe(csv.stringify())
    .pipe(fs.createWriteStream(`${DATA_DIR}updated_${file}`), {encoding: 'utf8'})
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
