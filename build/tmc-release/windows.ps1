$ErrorActionPreference = 'Stop'
$package = (Resolve-Path ../VSCode-win32-x64).Path
$state = 'unsigned'
function Sign-File($Path) {
    & signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /f $cert /p $env:PFX_PASSWORD $Path
    if ($LASTEXITCODE) { throw 'Authenticode signing failed' }
    & signtool verify /pa $Path
    if ($LASTEXITCODE) { throw 'Authenticode verification failed' }
}
try {
    if ($env:PFX_B64 -or $env:PFX_PASSWORD) {
        $cert = Join-Path $env:RUNNER_TEMP signing.pfx
        [IO.File]::WriteAllBytes($cert,[Convert]::FromBase64String($env:PFX_B64))
        Sign-File "$package/TechMeCoding.exe"
        $state = 'signed'
    }
    ./scripts/package-tmc-portable.ps1
    $prefix = "TechMeCoding-$env:VERSION-Windows-x64-$state"
    Move-Item "$env:RUNNER_TEMP/TechMeCoding-portable-win32-x64-*.zip" "dist/$prefix-portable.zip"
    $setup = "$prefix-setup"
    $compiler = "${env:ProgramFiles(x86)}/Inno Setup 6/ISCC.exe"
    & $compiler "/DReleaseVersion=$env:VERSION" "/DPackage=$package" "/DDestination=$PWD/dist" "/DFilename=$setup" build/tmc-release/windows.iss
    if ($LASTEXITCODE) { throw 'Installer compilation failed' }
    if ($state -eq 'signed') { Sign-File "dist/$setup.exe" }
    $target = "$env:RUNNER_TEMP/tmc-installed"
    $p = Start-Process "dist/$setup.exe" -ArgumentList "/VERYSILENT","/SUPPRESSMSGBOXES","/NORESTART","/DIR=`"$target`"" -Wait -PassThru
    if ($p.ExitCode) { throw 'Installation failed' }
    $version = & "$target/bin/code-oss.cmd" --version
    if ($LASTEXITCODE -or $env:GITHUB_SHA -notin $version -or 'x64' -notin $version) { throw 'Installed CLI verification failed' }
} finally {
    if ($cert) { Remove-Item $cert -ErrorAction SilentlyContinue }
}
