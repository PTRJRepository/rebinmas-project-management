Write-Host "Adding all changes to git..."
git add .

Write-Host "Committing changes with message 'checkpoint'..."
git commit -m "checkpoint"

Write-Host "Pushing changes to remote repository..."
git push origin master

Write-Host ""
Write-Host "Git commit and push completed!"
Pause