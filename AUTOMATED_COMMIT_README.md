# Automated Git Commit and Push Scripts

This repository contains scripts to automate the process of committing and pushing changes to GitHub.

## Available Scripts

### Windows Batch Script
- **File**: `commit-and-push.bat`
- **Usage**: Double-click the file or run `commit-and-push.bat` in Command Prompt

### PowerShell Script
- **File**: `commit-and-push.ps1`
- **Usage**: Run `.\commit-and-push.ps1` in PowerShell

### Node.js Script
- **File**: `commit-and-push.js`
- **Usage**: Run `node commit-and-push.js`

### Bash Script
- **File**: `commit-and-push.sh`
- **Usage**: Run `./commit-and-push.sh` (on Unix-like systems)

## What the Scripts Do

Each script performs the following operations:
1. Adds all changes to git (`git add .`)
2. Commits the changes with the message "ad dokumentasi plus image copy paste" (`git commit -m "ad dokumentasi plus image copy paste"`)
3. Pushes the changes to the remote repository (`git push origin master`)

## GitHub Token

The repository is configured with your GitHub token from the `.env` file to authenticate with GitHub.

## Notes

- The scripts will commit all tracked and untracked files in the repository
- The commit message is hardcoded as "ad dokumentasi plus image copy paste"
- The push operation targets the `master` branch