import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root (go up from dist-electron/electron/ to project root)
const projectRoot = path.resolve(__dirname, '../..')
config({ path: path.join(projectRoot, '.env') })

let mainWindow: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

function startServer() {
  const serverEntry = isDev
    ? path.join(projectRoot, 'src/main/index.ts')
    : path.join(__dirname, 'main/index.js')

  console.log('[Electron] Starting API server:', serverEntry)

  serverProcess = spawn(
    isDev ? 'tsx' : 'node',
    [serverEntry],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        API_PORT: '3001',
        NODE_ENV: isDev ? 'development' : 'production',
      },
      stdio: 'pipe',
    }
  )

  serverProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Server] ${data.toString().trim()}`)
  })

  serverProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[Server Error] ${data.toString().trim()}`)
  })

  serverProcess.on('close', (code: number) => {
    console.log(`[Electron] Server process exited with code ${code}`)
  })
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  startServer()

  setTimeout(() => {
    createWindow()
  }, 2000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})

ipcMain.handle('get-theme', () => {
  return 'light'
})

ipcMain.handle('set-theme', (_event, theme: string) => {
  return theme
})
