/**
 * Window Manager
 * Handles window creation, state persistence, and system tray
 */

import { BrowserWindow, app, Tray, Menu, nativeImage, screen } from 'electron';
import path from 'path';
import Store from 'electron-store';
import log from 'electron-log';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
};

export class WindowManager {
  public mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private store: Store<{ windowState: WindowState }>;

  constructor() {
    this.store = new Store<{ windowState: WindowState }>({
      defaults: {
        windowState: DEFAULT_WINDOW_STATE,
      },
    });
  }

  /**
   * Create the main application window
   */
  async createMainWindow(): Promise<BrowserWindow> {
    log.info('Creating main window...');

    const windowState = this.getWindowState();

    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: windowState.width,
      height: windowState.height,
      x: windowState.x,
      y: windowState.y,
      minWidth: 800,
      minHeight: 600,
      show: false, // Don't show until ready-to-show
      backgroundColor: '#1a1a1a',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: process.platform !== 'darwin',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true, // Protect against prototype pollution
        nodeIntegration: false, // Disable Node.js integration in renderer
        sandbox: true, // Enable sandbox
        webSecurity: true,
      },
    });

    // Restore maximized state
    if (windowState.isMaximized) {
      this.mainWindow.maximize();
    }

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      // Development: Load from Vite dev server
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      // Production: Load from built files
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      log.info('Window ready to show');
      this.mainWindow?.show();
    });

    // Save window state on resize/move
    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('maximize', () => this.saveWindowState());
    this.mainWindow.on('unmaximize', () => this.saveWindowState());

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (process.platform === 'darwin') {
        // On macOS, hide to tray instead of closing
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      log.info('Window closed');
      this.mainWindow = null;
    });

    // Create system tray
    this.createTray();

    log.info('Main window created successfully');
    return this.mainWindow;
  }

  /**
   * Create system tray icon and menu
   */
  private createTray(): void {
    if (this.tray) {
      return; // Already created
    }

    log.info('Creating system tray...');

    // Create tray icon (placeholder - replace with actual icon)
    const iconPath = path.join(__dirname, '../../resources/icons/tray-icon.png');
    let icon: ReturnType<typeof nativeImage.createFromPath>;

    try {
      icon = nativeImage.createFromPath(iconPath);
    } catch (error) {
      // Fallback to empty icon if file doesn't exist
      icon = nativeImage.createEmpty();
      log.warn('Tray icon not found, using empty icon');
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Garden of Eden V3');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Garden of Eden',
        click: () => {
          this.mainWindow?.show();
          this.mainWindow?.focus();
        },
      },
      {
        label: 'New Conversation',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          // TODO: Trigger new conversation via IPC
          this.mainWindow?.webContents.send('menu:new-conversation');
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // TODO: Open settings via IPC
          this.mainWindow?.webContents.send('menu:open-settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);

    // Double-click to show window
    this.tray.on('double-click', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });

    log.info('System tray created');
  }

  /**
   * Get saved window state or default
   */
  private getWindowState(): WindowState {
    const saved = this.store.get('windowState');

    // Ensure window is visible on current screen
    const { x, y } = saved;
    const bounds = screen.getPrimaryDisplay().bounds;

    // If saved position is off-screen, reset to center
    if (
      x !== undefined &&
      y !== undefined &&
      (x < bounds.x || x > bounds.x + bounds.width || y < bounds.y || y > bounds.y + bounds.height)
    ) {
      return {
        ...saved,
        x: undefined,
        y: undefined,
      };
    }

    return saved;
  }

  /**
   * Save current window state
   */
  private saveWindowState(): void {
    if (!this.mainWindow) {
      return;
    }

    const bounds = this.mainWindow.getBounds();
    const isMaximized = this.mainWindow.isMaximized();

    this.store.set('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized,
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    log.info('Cleaning up window manager...');

    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }

    if (this.mainWindow) {
      this.mainWindow.destroy();
      this.mainWindow = null;
    }
  }
}
