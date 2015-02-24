//'use strict';

let casper = require('casper').create({
  clientScripts: ['../../node_modules/lodash/dist/lodash.min.js',
                   '../../node_modules/jquery/dist/jquery.min.js'
                 ]})
let utils = require('utils')
let fs = require('fs') //fs here is a phantomjs module, not nodejs fs module
let userEmail = casper.cli.get('userEmail')
let userPass = casper.cli.get('userPass')
let EN = 'https://ww.e-activist.com/ea-account/'
let EN_LOGIN = `${EN}index.jsp`
let EN_EXPORT = `${EN}auth/selectFilters.jsp?type=user%20data`
let userAgent = 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0'

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

casper.thenOpen(EN_EXPORT, function () {
  this.echo('===> we are at webpage:')
  this.echo(this.getCurrentUrl())
  this.echo(this.getTitle())

  if (this.exists('input[name="profiles"]')) {
    this.echo('===> clicking profile button')
    this.click('input[name="profiles"]')
  }
  else {
    this.echo('ERROR: could not click on profile button. aborting') 
    this.exit()
  }
})

casper.then(function() {
  this.echo('===> successfully clicked profile button')
  this.echo('===> attempting to click on select users button')

  if (this.exists('input[name="Submit"]')) {
    this.echo('===> select users button exists. clicking it')
    this.click('input[name="Submit"]')
  }
  else {
    this.echo('ERROR: could not click on select users buttong. aborting') 
    this.exit()
  }
})


let extractProfileInfo = () => {
  //should try to always find all the available profiles to export. 
  let profilesDOM = document.querySelectorAll('ul#universeAvailable li')

  let profileDetails = _.reduce(profilesDOM, (acc, val, idx) => {
    let profile = {}
    profile.className = val.className
    profile.id = val.id
    profile.style = val.style
    acc.push(profile)
    return acc 
  }, [])

  return profileDetails
}

casper.then(function () {
  let profileDetails = this.evaluate(extractProfileInfo)
  fs.write('../../profileDetails.json', JSON.stringify(profileDetails), 'w')

})

casper.run()
