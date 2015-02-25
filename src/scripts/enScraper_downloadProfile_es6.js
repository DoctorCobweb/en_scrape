//'use strict';

let casper = require('casper').create({
  clientScripts: ['../../node_modules/lodash/dist/lodash.min.js',
                   '../../node_modules/jquery/dist/jquery.min.js']})
let utils = require('utils')
let fs = require('fs') //fs here is a phantomjs module, not nodejs fs module
let userEmail = casper.cli.get('userEmail')
let userPass = casper.cli.get('userPass')
let enJobId = casper.cli.get('enJobId')
let enProfId = casper.cli.get('enProfId')
let EN = 'https://ww.e-activist.com/ea-account/'
let EN_LOGIN = `${EN}index.jsp`
let EN_EXPORT = `${EN}auth/selectFilters.jsp?type=user%20data`
let userAgent = 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0'
let EN_DL_URL = `${EN}action.retrievejobresults.do?ea.job.id=${enJobId}&jobType=UDX&requestSource=menu`

casper.start()

casper.open(EN_LOGIN, {
  'method': 'get',
  'headers': {
    'user-agent': userAgent 
  }
})

casper.then(function ()  {
  this.echo('===> we are at webpage:')
  this.echo(this.getCurrentUrl())
  this.echo(this.getTitle())

  if (this.exists('form[name="accountLF"]')) {
    this.fillSelectors('form[name="accountLF"]', {
      'input[name="_f_0"]':userEmail,
      'input[name="_f_1"]':userPass
    }, true)
  }
  else {
    this.echo('ERROR: user login form not found. aborting') 
    this.exit()
  }
})

casper.then(function () {
  this.echo('===> should be logged in:...we are at webpage:')
  this.echo(this.getCurrentUrl())
  this.echo(this.getTitle())
  this.echo(`===> DOWNLOADING: ${enJobId} for profile ${enProfId}`)
  this.echo(EN_DL_URL)
  this.download(EN_DL_URL, `../data/profileId_${enProfId}_jobId_${enJobId}.csv`)
})

casper.run()
