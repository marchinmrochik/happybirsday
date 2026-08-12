@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do (
  if not defined NODE_EXE set "NODE_EXE=%%N"
)

if not defined NODE_EXE (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )
)

if not defined NODE_EXE (
  echo Node.js was not found in PATH.
  echo Install Node.js, or run this project inside the Codex runtime that provides bundled Node.
  exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
  echo Project dependencies are missing.
  echo Install dependencies first, then run dev.cmd again.
  exit /b 1
)

"%NODE_EXE%" "node_modules\next\dist\bin\next" dev -H 127.0.0.1 -p 3000
