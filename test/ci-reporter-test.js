'use strict';

const assert     = require('assert');
const sinon      = require('sinon');
const CIReporter = require('../lib/ci-reporter');

describe('CIReporter', () => {
  let logger, request, reporter, requestOptions;
  const directory = __dirname + '/fixtures/accessibility-reports';

  before(() => {
    request = CIReporter.request;
  });

  after(() => {
    CIReporter.request = request;
  });

  beforeEach(() => {
    requestOptions = undefined;
    CIReporter.request = function mockRequest(options, callback) {
      requestOptions = options;
      callback(null, {statusCode: 200}, 'body');
    };
    logger = sinon.spy();

    [
      'TRAVIS_REPO_SLUG', 'TRAVIS_BRANCH', 'TRAVIS_COMMIT'
    ].forEach((envar) => { delete process.env[envar]; });

    reporter = new CIReporter(directory, logger);
  });

  it('will not send if data is insufficient', (done) => {
    reporter.send((err) => {
      assert(err);
      assert(logger.withArgs('Missing data in environmental variables.').calledOnce);
      assert(!request.called);
      done();
    });
  });

  it('can send a request successfully', (done) => {
    process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
    process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
    process.env.TRAVIS_COMMIT = 'abc123abcebc';

    reporter.send((err) => {
      if (err) { done(err); }
      assert(logger.withArgs('Successfully sent accessibility test data!').calledOnce);
      done(err);
    });
  });

  it('sends a request of the right type to the right url', (done) => {
    process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
    process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
    process.env.TRAVIS_COMMIT = 'abc123abcebc';

    reporter.send((err) => {
      if (err) { done(err); }
      assert(logger.withArgs('Successfully sent accessibility test data!').calledOnce);
      assert.equal(requestOptions.uri, 'https://continua11y-staging.apps.cloud.gov/reports');
      assert.equal(requestOptions.method, 'POST');
      done(err);
    });
  });

  it('sends along the packaged data', (done) => {
    process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
    process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
    process.env.TRAVIS_COMMIT = 'abc123abcebc';

    reporter.send((err) => {
      if (err) { done(err); }
      let json = requestOptions.json;
      assert.equal(json.repo, 'continua11y-due');
      assert.equal(json.owner, '18F');
      assert.equal(json.branch, 'branchety-branch-branch');
      assert.equal(json.commit, 'abc123abcebc');
      assert.equal(json.tests.length, 2);
      assert.deepEqual(json.tests.map((test) => { return test.size; }), ['desktop', 'mobile']);
      done(err);
    });
  });
});
