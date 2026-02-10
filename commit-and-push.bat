@echo off
echo Adding all changes to git...
git add .

rem Check if there are any changes to commit
git diff --cached --quiet
if %errorlevel% equ 0 (
    git diff --quiet
    if %errorlevel% equ 0 (
        echo No changes to commit. Nothing to do.
        pause
        exit /b 0
    )
)

echo Committing changes with message "ad dokumentasi plus image copy paste"...
git commit -m "ad dokumentasi plus image copy paste" --allow-empty

echo Pushing changes to remote repository...
git push origin master

echo.
echo Git commit and push completed!
pause