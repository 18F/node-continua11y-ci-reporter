'use strict';

const assert = require('assert');
const Data   = require('../lib/data');

describe('Data', () => {
  let data;

  beforeEach(() => {
    [
      'TRAVIS_REPO_SLUG', 'TRAVIS_BRANCH', 'TRAVIS_PULL_REQUEST_BRANCH',
      'TRAVIS_COMMIT', 'TRAVIS_PULL_REQUEST_SHA', 'TRAVIS_PULL_REQUEST'
    ].forEach((envar) => { delete process.env[envar]; });
    data = new Data();
  });

  it('extracts the owner and repo name from the repo slug', () => {
    process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
    assert.equal(data.owner(), '18F');
    assert.equal(data.repo(), 'continua11y-due');
  });

  it('gets the branch when available via TRAVIS_BRANCH', () => {
    process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
    process.env.TRAVIS_PULL_REQUEST_BRANCH = 'pull-branch';
    assert.equal(data.branch(), 'branchety-branch-branch');
  });

  it('get the branch via pull request data if normal env var not available', () => {
    process.env.TRAVIS_PULL_REQUEST_BRANCH = 'pull-branch';
    assert.equal(data.branch(), 'pull-branch');
  });

  it('get the commit via TRAVIS_COMMIT', () => {
    process.env.TRAVIS_COMMIT = 'abc123abcebc';
    process.env.TRAVIS_PULL_REQUEST_SHA = '111aaa2349b';
    assert.equal(data.commit(), 'abc123abcebc');
  });

  it('get the commit via pull request data if normal env var not available', () => {
    process.env.TRAVIS_PULL_REQUEST_SHA = '111aaa2349b';
    assert.equal(data.commit(), '111aaa2349b');
  });

  it('converts the pull request envar into a real boolean', () => {
    process.env.TRAVIS_PULL_REQUEST = 'true';
    assert.strictEqual(data.pullRequest(), true);
    process.env.TRAVIS_PULL_REQUEST = 'false';
    assert.strictEqual(data.pullRequest(), false);
  });

  describe('valid', () => {
    it('requires a repo and owner', () => {
      process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
      process.env.TRAVIS_COMMIT = 'abc123abcebc';
      assert(!data.valid());
    });

    it('requires a commit', () => {
      process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
      process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
      assert(!data.valid());
    });

    it('requires a branch', () => {
      process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
      process.env.TRAVIS_COMMIT = 'abc123abcebc';
      assert(!data.valid());
    });

    it('is valid if all are present', () => {
      process.env.TRAVIS_REPO_SLUG = '18F/continua11y-due';
      process.env.TRAVIS_BRANCH = 'branchety-branch-branch';
      process.env.TRAVIS_COMMIT = 'abc123abcebc';
      assert(data.valid());
    });
  });
});
