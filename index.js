const toc = require('markdown-toc')
const getConfig = require('probot-config')
const path = require('path')
const appUser = process.env.APP_NAME + '[bot]'

module.exports = robot => {
  robot.on('push', async context => {
    let push = context.payload

    // don't run toc-me if the last commit was pushed by toc-me
    if (push.pusher.name !== appUser) {
      let compare
      let branch = push.ref.replace('refs/heads/', '')

      if (push.before !== '0000000000000000000000000000000000000000') {
        compare = await context.github.repos.compareCommits(context.repo({
          base: push.before,
          head: push.after
        }))
      } else {
        compare = await context.github.repos.getCommit(context.repo({
          sha: push.after
        }))
      }

      // for each file in the commit
      /// return Promise.all(compare.data.files.map(async file => {
      for (const file of compare.data.files) {
        if (path.extname(file.filename).toLowerCase() === '.md') {
          let content = await context.github.repos.getContents(context.repo({
            path: file.filename,
            ref: branch
          }))

          // grab the file content
          let text = Buffer.from(content.data.content, 'base64').toString()

          // check if markdown includes the markdown-toc comment formatting
          if (text.includes('<!-- toc ')) {
            let config = await getConfig(context, 'toc.yml')
            let updated = await toc.insert(text, config)

            // markdown-toc will sometimes add an additional newline character
            // this checks to see if it has happened and removes it
            if (updated.charAt((updated.length) - 2) === '\n') {
              updated = updated.slice(0,-1)
            }

            // if the resulting file does not end in a newline character, add one
            if (updated.charAt((updated.length) - 1) !== '\n') {
              updated = updated + '\n'
            }

            // update the file if TOC has changed
            if (updated !== text) {
              await context.github.repos.updateFile(context.repo({
                path: file.filename,
                message: `Update ToC for ${file.filename}`,
                content: Buffer.from(updated).toString('base64'),
                sha: content.data.sha,
                branch
              }))
            }
          }
        }
      }
    }
  })
}
