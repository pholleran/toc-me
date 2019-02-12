const nock = require('nock')
// Requiring our app implementation
const tocMe = require('..')
const { Probot } = require('probot')
const _ = require('lodash')

// Requiring our fixtures
const tocFormatterAdded = require('./fixtures/push.toc_formatter_added')
const commits = require('./fixtures/commits.get_df298')
const readmeContents = require('./fixtures/contents.get_README.md')
const configContents = require('./fixtures/contents.get_toc.yml')

nock.disableNetConnect()

describe('My Probot app', async () => {
  let probot

  beforeEach(() => {
    probot = new Probot({})
    const app = probot.load(tocMe)

    // just return a test token
    app.app = () => 'test'
  })

  test('creates a new toc when one does not exist', async() => {
    // mock an installation token
    nock('https://api.github.com')
      .log(console.log)
      .post('/app/installations/240195/access_tokens')
      .reply(200, { token: 'test' })

    // mock the compare commit endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/compare/0000000000000000000000000000000000000000...df298f9a4ddca521f91a1d448e4e409ef56118bf')
      .reply(200)

    // mock the get commit endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/commits/df298f9a4ddca521f91a1d448e4e409ef56118bf')
      .reply(200, commits)

    // mock the request for the markdown file
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/README.md?ref=add-toc')
      .reply(200, readmeContents)

    // mock the request for the yaml config
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/.github/toc.yml')
      .reply(200, configContents)

    // mock the request to pudate the readme
    nock('https://api.github.com')
      .put('/repos/pholleran/test-toc-me/contents/README.md', _.matches({sha: "bd41e069baf05250d85060f6694adfdc40f1222f"}))
      .reply(200)

    await probot.receive({name: 'push', payload: tocFormatterAdded})
  })
})
