Write-Host "Adding all changes to git..."
git add .

# Check if there are any changes to commit
$hasChanges = $true
git diff --cached --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    git diff --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        $hasChanges = $false
    }
}

if (-not $hasChanges) {
    Write-Host "No changes to commit. Nothing to do."
    Pause
    exit 0
}

Write-Host "Committing changes with message 'ad dokumentasi plus image copy paste'..."
git commit -m "ad dokumentasi plus image copy paste" --allow-empty

Write-Host "Pushing changes to remote repository..."
git push origin master

Write-Host ""
Write-Host "Git commit and push completed!"
Pause