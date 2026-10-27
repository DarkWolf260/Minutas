const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PORT, SESSION_DATA_PATH } = require('./config');

function cleanupEnvironment() {
  if (process.platform !== 'win32') return;

  try {
    const currentPid = process.pid;
    const targetSession = path.resolve(SESSION_DATA_PATH);

    const psScript = `
      $target = "${targetSession.replace(/"/g, '`"')}"
      $portPids = (Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess | Where-Object { $_ -ne ${currentPid} -and $_ -gt 0 }
      foreach ($p in $portPids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
      }
      Get-CimInstance Win32_Process -Filter "Name like '%edge%' or Name like '%chrome%'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -and (
          $_.CommandLine.IndexOf($target, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -or
          ($_.CommandLine -like "*--user-data-dir=*" -and $_.CommandLine -like "*session*")
        )
      } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
    `;

    const buffer = Buffer.from(psScript, 'utf16le');
    const base64 = buffer.toString('base64');

    spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', base64], {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 7000
    });
  } catch (_) {
    // Si PowerShell falla o tiene timeout, continuar
  }

  // Limpiar lockfiles residuales en la carpeta de sesión para que Edge no detecte un perfil bloqueado
  try {
    const candidateDirs = [
      SESSION_DATA_PATH,
      path.join(SESSION_DATA_PATH, 'session')
    ];

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;
      const lockFiles = [
        path.join(dir, 'DevToolsActivePort'),
        path.join(dir, 'lockfile'),
        path.join(dir, 'Default', 'LOCK'),
        path.join(dir, 'Default', 'Preferences~'),
        path.join(dir, 'SingletonLock'),
        path.join(dir, 'SingletonCookie'),
        path.join(dir, 'SingletonSocket')
      ];
      for (const file of lockFiles) {
        if (fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
}

module.exports = {
  cleanupEnvironment
};
