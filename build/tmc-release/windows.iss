[Setup]
AppId=io.github.clark-2468.TechMeCoding
AppName=TechMeCoding
AppVersion={#ReleaseVersion}
DefaultDirName={localappdata}\Programs\TechMeCoding
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir={#Destination}
OutputBaseFilename={#Filename}
Compression=lzma2
UninstallDisplayIcon={app}\TechMeCoding.exe
[Files]
Source: "{#Package}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "data\*"
[Icons]
Name: "{userprograms}\TechMeCoding"; Filename: "{app}\TechMeCoding.exe"
