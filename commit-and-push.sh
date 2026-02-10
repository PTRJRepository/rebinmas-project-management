#!/bin/bash

echo "Adding all changes to git..."
git add .

echo "Committing changes with message 'checkpoint'..."
git commit -m "checkpoint"

echo "Pushing changes to remote repository..."
git push origin master

echo
echo "Git commit and push completed!"