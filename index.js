const toc = require('markdown-toc')
const getConfig = require('probot-config')
const path = require('path')

module.exports = robot => {
  robot.on('push', async context => {
    
    let push = context.payload
    
    let compare 
    
    if(push.before != '0000000000000000000000000000000000000000'){
      compare = await context.github.repos.compareCommits(context.repo({
        base: push.before,
        head: push.after
    }))
    } else {
      compare = await context.github.repos.getCommit(context.repo({
        sha: push.after
      }))
    }

    let branch = push.ref.replace('refs/heads/', '')

    return Promise.all(compare.data.files.map(async file => {
      
      if (path.extname(file.filename).toLowerCase() == '.md'){
        let content = await context.github.repos.getContent(context.repo({
          path: file.filename,
          ref:branch
        }))
        
        let text = Buffer.from(content.data.content, 'base64').toString()

        if (text.slice(-1) !== '\n') {
          text = text + '\n'
        }

        // check if markdown includes the markdown-toc comment formatting
        if (text.includes('<!-- toc ')) {
          let config = await getConfig(context, 'toc.yml')

          // toc.insert() adds a trailing newline character we need to remove
          let updated = toc.insert(text, config)

          if (updated != text) {
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
