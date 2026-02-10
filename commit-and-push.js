const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function gitCommitAndPush() {
  try {
    console.log('Adding all changes to git...');
    // Use git add with a more specific pattern to avoid problematic files
    const { stdout: addStdout, stderr: addStderr } = await execAsync('git add -A . --ignore-errors');
    if (addStderr) console.error(`Add stderr: ${addStderr}`);
    console.log(`Add stdout: ${addStdout}`);

    // Check if there are any changes to commit
    try {
      await execAsync('git diff --cached --quiet');
      await execAsync('git diff --quiet');
      console.log('No changes to commit. Nothing to do.');
      return;
    } catch (error) {
      // If git diff returns non-zero exit code, it means there are changes to commit
      // Continue with the commit process
    }

    console.log('Committing changes with message "memperbaiki desain lebih futuristik"...');
    const { stdout: commitStdout, stderr: commitStderr } = await execAsync('git commit -m "memperbaiki desain lebih futuristik" --allow-empty');
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