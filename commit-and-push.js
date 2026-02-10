const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function gitCommitAndPush() {
  try {
    console.log('Adding all changes to git...');
    const { stdout: addStdout, stderr: addStderr } = await execAsync('git add .');
    if (addStderr) console.error(`Add stderr: ${addStderr}`);
    console.log(`Add stdout: ${addStdout}`);

    console.log('Committing changes with message "checkpoint"...');
    const { stdout: commitStdout, stderr: commitStderr } = await execAsync('git commit -m "checkpoint"');
    if (commitStderr) console.error(`Commit stderr: ${commitStderr}`);
    console.log(`Commit stdout: ${commitStdout}`);

    console.log('Pushing changes to remote repository...');
    const { stdout: pushStdout, stderr: pushStderr } = await execAsync('git push origin master');
    if (pushStderr) console.error(`Push stderr: ${pushStderr}`);
    console.log(`Push stdout: ${pushStdout}`);

    console.log('\nGit commit and push completed!');
  } catch (error) {
    console.error('Error during git operations:', error.message);
  }
}

gitCommitAndPush();