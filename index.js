var toc = require('markdown-toc')
const getConfig = require('probot-config')
const path = require('path')

module.exports = robot => {
  robot.on('push', async context => {
    
    const markdownFiles = {}
    const push = context.payload

    const compare = await context.github.repos.compareCommits(context.repo({
      base: push.before,
      head: push.after
    }))

    const branch = push.ref.replace('refs/heads/', '')

    return Promise.all(compare.data.files.map(async file => {
      if (path.extname(file.filename).toLowerCase() == '.md'){
        const content = await context.github.repos.getContent(context.repo({
          path: file.filename,
          ref:branch
        }))

        const text = Buffer.from(content.data.content, 'base64').toString()

        if (text.includes('<!-- toc ')) {
          let config = await getConfig(context, 'toc.yml')
          var updated = toc.insert(text, config)
          
          if (updated) {
            context.github.repos.updateFile(context.repo({
              path: file.filename,
              message: `Update ToC for ${file.filename}`,
              content: Buffer.from(updated).toString('base64'),
              sha: content.data.sha,
              branch
            }))
          }
        }
      } 
    }))

  })
}
