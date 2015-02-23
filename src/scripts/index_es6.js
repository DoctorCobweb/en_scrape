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
let chalk           = require('chalk')
let BOOTH_BASE_NAME = 'ems_polling_booth'
let PRIVATE_DETAILS = '../../.privateDetails.json'
let htmlparser      = require('htmlparser2')
let Parser          = require('parse5').Parser
let userEmail
let userPass


fs.readFile(PRIVATE_DETAILS, (err, data) => {
  if (err) throw err

  let pDetails = JSON.parse(data)
  userEmail    = pDetails.userEmail
  userPass     = pDetails.userPass

  scraperBegin()
  //readScrapeFiles()
})

let scraperBegin = () => {
  let districts = {
    'buninyong'      : '1465',
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
  }

  _.forEach(districts, (val, key) => {
    let cmd = 'casperjs --engine=slimerjs '
	    + `--userEmail=${userEmail} `
            + `--userPass=${userPass} `
	    + `--boothId=${val} `
	    + `--district=${key} `
	    + 'enScraper_es6_babelled.js'
   
    console.log(chalk.bgGreen('===> calling enScraper.js using casperjs'))
    console.log(cmd)

    beginAScrape(cmd)
  })
}

let beginAScrape = (cmd) => {
  
  exec(cmd, {}, (err, stdout, stderr) => {
    if (err) throw err
    console.log('in exec callback') 
    console.log(stdout) 
  })
}

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
