'use strict';

const fs      = require('fs');
const async   = require('async');
const request = require('request');
const Data    = require('./data');

class CIReporter {
  constructor(directory, logger) {
    this.directory  = directory;
    this.logger     = logger;
    this.data       = new Data(this.logger);
  }

  send(callback) {
    callback = callback || function () {};

    if (!this.data.valid()) {
      this.logger('Missing data in environmental variables.');
      this.logger('Currently module only works on Travis. Ensure TRAVIS_REPO_SLUG, TRAVIS_BRANCH, and TRAVIS_COMMIT are set.');
      callback(new Error('Insufficient environmental variables'));
    } else {
      this.packageAndSend(callback);
    }
  }

  packageAndSend(callback) {
    async.waterfall([
      (next)              => { this.readDirectory(next); },
      (files, next)       => { this.aggregateFiles(files, next); },
      (filenames, next)   => { this.wrapJSON(filenames, next); },
      (json, next)        => { this.sendToDashboard(json, next); },
    ], callback);
  }

  readDirectory(next) {
    this.logger('Reading', this.directory);
    fs.readdir(this.directory, next);
  }

  aggregateFiles(filenames, next) {
    this.logger('Aggregating', filenames.count, 'tests');
    let filePaths = filenames.map((name) => { return this.directory + '/' + name; });
    async.mapSeries(filePaths, fs.readFile, next);
  }

  wrapJSON(collection, next) {
    collection = collection.map((buffer) => { return buffer.toString(); });
    collection = collection.map((string) => { return JSON.parse(string); } );

    next(null, {
      repo:         this.data.repo(),
      owner:        this.data.owner(),
      branch:       this.data.branch(),
      commit:       this.data.commit(),
      pull_request: this.data.pullRequest(),
      tests:        collection,
      timestamp:    new Date().getTime()
    });
  }

  sendToDashboard(json, next) {
    this.logger('Sending content to', this.data.url()); // CONTINUA11Y_URL

    let options = {
      uri: this.data.url(),
      method: 'POST',
      json: json
    };

    CIReporter.request(options, (err, response, body) => {
      this.onRequestComplete(err, response, body, next);
    });
  }

  onRequestComplete(err, response, body, next) {
    if (!err && response.statusCode < 200 && response.statusCode > 300) {
      err = new Error(response.statusCode);
    }

    if (err) {
      this.logger('Something went wrong with the call to continua11y :(');
    } else {
      this.logger('Successfully sent accessibility test data!');
    }

    next(err, body);
  }
}

CIReporter.request = request;

module.exports = CIReporter;
