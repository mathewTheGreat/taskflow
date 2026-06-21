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
    serverProcess.on('close', (code: number) => {
      console.log(`[Electron] Server process exited with code ${code}`)
    })

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000))
  } else {
    // Production: inline the Express server in the Electron process
    console.log('[Electron] Starting inline API server...')
    const { startServer: runServer } = await import(path.join(__dirname, '../src/main/index.js'))
    runServer()
    // Wait briefly for Express to start listening
    await new Promise(resolve => setTimeout(resolve, 2000))
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
