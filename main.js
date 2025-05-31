const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // アイコンパス
    title: 'しりとりレース'
  });

  // HTMLファイルを読み込み
  mainWindow.loadFile('index.html');

  // 開発時のみDevToolsを表示
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // メニューバーを設定
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'ゲーム',
      submenu: [
        {
          label: '新しいゲーム',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.reload();
          }
        },
        {
          type: 'separator'
        },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: '再読み込み',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          }
        },
        {
          label: '全画面表示',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          type: 'separator'
        },
        {
          label: '開発者ツール',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'しりとりレースについて',
          click: () => {
            // About dialog can be added here
          }
        }
      ]
    }
  ];

  // macOSの場合はメニュー構造を調整
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'しりとりレースについて',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'サービス',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'しりとりレースを隠す',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: '他を隠す',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'すべて表示',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: '終了',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// アプリが準備完了したらウィンドウを作成
app.whenReady().then(createWindow);

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOSでDockアイコンがクリックされた時にウィンドウがない場合は作成
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
  });
});