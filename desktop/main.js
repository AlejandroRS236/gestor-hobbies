// Proceso principal de Electron: arranca el backend (Spring Boot) y abre la ventana.
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const PUERTO = process.env.PORT || '8080';
const URL_BACKEND = `http://localhost:${PUERTO}`;
// En desarrollo usamos el servidor de Vite; si no, el build del frontend.
const URL_DESARROLLO = process.env.VITE_DEV_SERVER_URL;
const JAR = path.join(__dirname, '..', 'api', 'target', 'gestor-hobbies-api.jar');

let backend;

function arrancarBackend() {
  backend = spawn('java', ['-jar', JAR], {
    env: { ...process.env, PORT: PUERTO },
    stdio: 'inherit',
  });
  backend.on('error', (e) => dialog.showErrorBox('No se pudo arrancar el backend', e.message));
}

function esperarBackend(intentos = 60) {
  return new Promise((resolve, reject) => {
    const probar = (restantes) => {
      http
        .get(`${URL_BACKEND}/api/figuras`, (res) => {
          res.resume();
          resolve();
        })
        .on('error', () => {
          if (restantes <= 0) return reject(new Error('El backend no respondió a tiempo'));
          setTimeout(() => probar(restantes - 1), 1000);
        });
    };
    probar(intentos);
  });
}

async function crearVentana() {
  const ventana = new BrowserWindow({ width: 1280, height: 820, title: 'Gestor de hobbies' });
  if (URL_DESARROLLO) {
    await ventana.loadURL(URL_DESARROLLO);
  } else {
    // El build del frontend se sirve desde el propio backend en /.
    await ventana.loadURL(URL_BACKEND);
  }
}

app.whenReady().then(async () => {
  arrancarBackend();
  try {
    await esperarBackend();
    await crearVentana();
  } catch (e) {
    dialog.showErrorBox('Gestor de hobbies', e.message);
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());
app.on('quit', () => backend && backend.kill());
