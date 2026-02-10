#!/bin/bash

echo "Adding all changes to git..."
git add .

# Check if there are any changes to commit
if git diff --cached --quiet && git diff --quiet; then
    echo "No changes to commit. Nothing to do."
    exit 0
fi

echo "Committing changes with message 'ad dokumentasi plus image copy paste'..."
git commit -m "ad dokumentasi plus image copy paste" --allow-empty

echo "Pushing changes to remote repository..."
git push origin master

echo
echo "Git commit and push completed!"