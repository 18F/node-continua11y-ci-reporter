#!/usr/bin/env node

'use strict';

let program       = require('commander');
const CIReporter  = require('./lib/ci-reporter');

program
  .arguments('<directory>')
  .action((directory) => {
    let reporter = new CIReporter(directory, console.log);
    reporter.send();
  })
  .parse(process.argv);
