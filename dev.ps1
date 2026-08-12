$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1
$nodeExe = if ($nodeCommand) { $nodeCommand.Source } else { $null }
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not $nodeExe -and (Test-Path -LiteralPath $bundledNode)) {
  $nodeExe = $bundledNode
}

if (-not $nodeExe) {
  Write-Error "Node.js was not found in PATH. Install Node.js, or run this project inside the Codex runtime that provides bundled Node."
  exit 1
}

$nextBin = Join-Path $PSScriptRoot "node_modules\next\dist\bin\next"

if (-not (Test-Path -LiteralPath $nextBin)) {
  Write-Error "Project dependencies are missing. Install dependencies first, then run dev.ps1 again."
  exit 1
}

& $nodeExe $nextBin dev -H 127.0.0.1 -p 3000
exit $LASTEXITCODE
