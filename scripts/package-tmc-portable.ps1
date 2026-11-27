# Run after gulp vscode-win32-x64 on a Windows x64 machine.
[CmdletBinding()]
param(
    [string]$OutputDirectory = $(if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [IO.Path]::GetTempPath() })
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$commit = git -C $root rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'Cannot determine the build commit.' }
$package = Join-Path (Split-Path $root -Parent) 'VSCode-win32-x64'
$product = Get-Content -Raw -LiteralPath "$package/resources/app/product.json" | ConvertFrom-Json
if ($product.commit -ne $commit -or $product.PSObject.Properties['target']) {
    throw 'A matching Windows archive build is required for portable mode.'
}
foreach ($file in 'TechMeCoding.exe', 'resources/app/out/main.js', 'icudtl.dat', 'resources.pak') {
    if (-not (Test-Path -LiteralPath "$package/$file" -PathType Leaf)) { throw "Missing $file" }
}
foreach ($dir in 'data', 'TMC-Lessons') {
    if (Test-Path -LiteralPath "$package/$dir") { throw "Rebuild using a clean package before archiving $dir." }
}
$lessons = @(Get-ChildItem "$root/docs/techmecoding/*.tmc.json" -File)
if (-not $lessons.Count) { throw 'No example lessons found.' }
foreach ($dir in 'data/user-data', 'data/extensions', 'data/tmp', 'TMC-Lessons') {
    New-Item -ItemType Directory -Path "$package/$dir" -Force | Out-Null
}
Copy-Item -LiteralPath $lessons.FullName -Destination "$package/TMC-Lessons"
Copy-Item -LiteralPath "$root/docs/techmecoding/lesson-format.md" -Destination "$package/TMC-Lessons"

$archive = Join-Path $OutputDirectory "TechMeCoding-portable-win32-x64-$($commit.Substring(0,12)).zip"
[IO.Compression.ZipFile]::CreateFromDirectory($package, $archive)
$extract = Join-Path ([IO.Path]::GetTempPath()) ("TMC portable test " + [guid]::NewGuid())
[IO.Compression.ZipFile]::ExtractToDirectory($archive, $extract)
foreach ($entry in @('data/user-data','data/extensions','data/tmp') + @($lessons | ForEach-Object { "TMC-Lessons/$($_.Name)" })) {
    if (-not (Test-Path -LiteralPath "$extract/$entry")) { throw "ZIP is missing $entry" }
}
$version = & "$extract/bin/$($product.applicationName).cmd" --version
if ($LASTEXITCODE -ne 0 -or $commit -notin $version -or 'x64' -notin $version) {
    throw "Unexpected packaged CLI version: $version"
}
$process = Start-Process -FilePath "$extract/TechMeCoding.exe" -ArgumentList '--disable-extensions','--new-window' -PassThru
try {
    $deadline = [DateTime]::UtcNow.AddSeconds(90)
    while (-not (Test-Path "$extract/data/user-data/logs/*/main.log")) {
        if ($process.HasExited -or [DateTime]::UtcNow -ge $deadline) { throw 'Portable launch did not create its local application log.' }
        Start-Sleep -Seconds 1
    }
} finally {
    if (-not $process.HasExited) { $process.Kill($true); $process.WaitForExit() }
}
Write-Output "Portable ZIP verified: $archive"
