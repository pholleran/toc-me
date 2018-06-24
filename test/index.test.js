const expect = require('expect')
const {createRobot} = require('probot')
const plugin = require('../index')

describe('plugin', () => {
  let robot
  let event
  let sync

  beforeEach(() => {
    robot = createRobot()
    robot.auth = () => Promise.resolve({})

    sync = jest.fn()

    plugin(robot, {}, {sync, FILE_NAME: '.github/toc.yml'})
  })

  describe('when a push contains markdown files', () => {

    // it generates a TOC for files with a '<!-- toc '

    // it ignores markdown files without a '<!-- toc '

    // it handles uppercase `.MD` extensions

  })

  describe('when a push does not contain markdown files', () => {

  })
})