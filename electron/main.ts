import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { spawn, execSync, ChildProcess } from 'child_process'
import { config } from 'dotenv'
import http from 'http'

// Kill stale TaskFlow processes from previous installs (they don't have the single-instance lock)
function killStaleInstances() {
  try {
    const currentPid = process.pid
    const output = execSync(
      `powershell -Command "Get-CimInstance Win32_Process -Filter \\\"Name='TaskFlow.exe' AND ProcessId -ne ${currentPid}\\\" | Select-Object -ExpandProperty ProcessId"`,
      { encoding: 'utf8', timeout: 5000 }
    )
    const pids = output.trim().split('\n').filter(Boolean).map(Number).filter(n => !isNaN(n) && n > 0)
    for (const pid of pids) {
      try { process.kill(pid) } catch {}
    }
  } catch {}
}
killStaleInstances()

// Single-instance lock — prevents port conflicts from stale instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Load .env from asar root (dist-electron/electron/ -> app.asar/)
const projectRoot = path.resolve(__dirname, '../..')
const envPath = path.join(projectRoot, '.env')
console.log('[Electron] Looking for .env at:', envPath)
config({ path: envPath })

// Force production env when packaged regardless of .env contents
if (app.isPackaged) {
  process.env.NODE_ENV = 'production'
}

console.log('[Electron] DATABASE_URL set:', !!process.env.DATABASE_URL)
console.log('[Electron] isDev:', !app.isPackaged, 'NODE_ENV:', process.env.NODE_ENV)

let mainWindow: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null

const isDev = !app.isPackaged

function waitForHealth(url: string, maxRetries = 30, intervalMs = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      attempts++
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log('[Electron] Server health check passed')
          resolve()
        } else if (attempts < maxRetries) {
          setTimeout(check, intervalMs)
        } else {
          reject(new Error(`Server health check failed after ${maxRetries} attempts`))
        }
      })
      req.on('error', () => {
        if (attempts < maxRetries) {
          setTimeout(check, intervalMs)
        } else {
          reject(new Error(`Server health check failed after ${maxRetries} attempts`))
        }
      })
      req.end()
    }
    check()
  })
}

async function startServer(): Promise<void> {
  if (isDev) {
    // Dev mode: spawn child process with tsx for hot-reload
    const serverEntry = path.join(projectRoot, 'src/main/index.ts')
    const tsxCli = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
    console.log('[Electron] Starting API server via tsx:', serverEntry)

    serverProcess = spawn(process.execPath, [tsxCli, serverEntry], {
      cwd: projectRoot,
      env: {
        ...process.env,
        API_PORT: '3001',
        NODE_ENV: 'development',
      },
      stdio: 'pipe',
    })

    serverProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`[Server] ${data.toString().trim()}`)
    })
    serverProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[Server Error] ${data.toString().trim()}`)
    })
    serverProcess.on('error', (err: Error) => {
      console.error('[Electron] Server process spawn error:', err.message)
    })
    serverProcess.on('close', (code: number) => {
      console.log(`[Electron] Server process exited with code ${code}`)
    })

    // Wait for server to be ready via health check
    await waitForHealth('http://localhost:3001/api/health')
  } else {
    // Production: inline the Express server in the Electron process
    console.log('[Electron] Starting inline API server...')
    try {
      const { startServer: runServer } = require(path.join(__dirname, '../src/main/index.js'))
      runServer()
      // Wait for server to be ready via health check
      await waitForHealth('http://localhost:3001/api/health')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : ''
      console.error('[Electron] Failed to load inline server:', msg, stack)
      dialog.showErrorBox('Server Error', `Failed to start API server:\n${msg}`)
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'TaskFlow',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#EDEDED',
    icon: path.join(__dirname, '..', '..', 'electron-icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(projectRoot, 'dist-react', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (isDev && serverProcess) {
      serverProcess.kill()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  // Only kill the child process in dev mode — production runs inline
  if (isDev && serverProcess) {
    serverProcess.kill()
  }
})

ipcMain.handle('get-theme', () => {
  return 'light'
})

ipcMain.handle('set-theme', (_event, theme: string) => {
  return theme
})
