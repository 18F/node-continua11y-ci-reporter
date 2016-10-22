'use strict';

let env = process.env;

// NOTE: this is really an extractor for TRAVIS.
// For other CI environments we will want to create different adapters.
class Data {
  constructor(logger) {
    this.logger = logger;
  }

  url() {
    let baseUrl = env.CONTINUA11Y_URL || 'https://continua11y-staging.apps.cloud.gov';
    return baseUrl + '/reports';
  }

  owner() {
    return this.parseSlug(0);
  }

  repo() {
    return this.parseSlug(1);
  }

  branch() {
    return env.TRAVIS_BRANCH || env.TRAVIS_PULL_REQUEST_BRANCH;
  }

  commit() {
    return env.TRAVIS_COMMIT || env.TRAVIS_PULL_REQUEST_SHA;
  }

  pullRequest() {
    return env.TRAVIS_PULL_REQUEST === 'true' ? true : false;
  }

  valid() {
    return !!(this.owner() && this.branch() && this.commit());
  }

  parseSlug(n) {
    let slug = env.TRAVIS_REPO_SLUG || '';
    let parts = slug.split('/');
    return parts[n];
  }
}

module.exports = Data;
