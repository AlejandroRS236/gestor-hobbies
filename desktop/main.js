// Proceso principal de Electron: arranca el backend (Spring Boot) por debajo y abre la ventana de la app.
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const EMPAQUETADA = app.isPackaged;
// En desarrollo se puede apuntar al servidor de Vite: VITE_DEV_SERVER_URL=http://localhost:5173
const URL_DESARROLLO = process.env.VITE_DEV_SERVER_URL;

let backend = null;
let ventana = null;
let saliendo = false;
// Mientras solo está abierta la ventana de configuración, cerrarla no debe cerrar la app.
let configurando = false;

const carpetaDatos = () => app.getPath('userData');
const archivoConfig = () => path.join(carpetaDatos(), '.env');
const archivoLog = () => path.join(carpetaDatos(), 'backend.log');

function rutaJava() {
  if (!EMPAQUETADA) return 'java';
  return path.join(process.resourcesPath, 'jre', 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
}

function rutaJar() {
  return EMPAQUETADA
    ? path.join(process.resourcesPath, 'backend', 'gestor-hobbies-api.jar')
    : path.join(__dirname, '..', 'api', 'target', 'gestor-hobbies-api.jar');
}

/** Un puerto libre, para no chocar con otros programas (por ejemplo, otro Spring Boot en el 8080). */
function puertoLibre() {
  return new Promise((resolve, reject) => {
    const servidor = net.createServer();
    servidor.unref();
    servidor.on('error', reject);
    servidor.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address();
      servidor.close(() => resolve(port));
    });
  });
}

// ---------- Configuración de la base de datos (primer arranque) ----------

function leerConfig() {
  try {
    const datos = {};
    for (const linea of fs.readFileSync(archivoConfig(), 'utf8').split(/\r?\n/)) {
      const i = linea.indexOf('=');
      if (i > 0 && !linea.trimStart().startsWith('#')) datos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
    }
    return datos;
  } catch {
    return null;
  }
}

/** Formato .properties: la barra invertida es especial y se escapa. */
const escapar = (valor) => String(valor ?? '').replace(/\\/g, '\\\\');

function guardarConfig({ url, usuario, contrasena }) {
  fs.mkdirSync(carpetaDatos(), { recursive: true });
  const texto = [
    '# Conexión a la base de datos del Gestor de hobbies. Puedes cambiarla desde la app.',
    `DB_URL=${escapar(url)}`,
    `DB_USER=${escapar(usuario)}`,
    `DB_PASSWORD=${escapar(contrasena)}`,
    '',
  ].join('\n');
  fs.writeFileSync(archivoConfig(), texto, { encoding: 'utf8', mode: 0o600 });
}

/** Pide los datos de Supabase en una ventana pequeña y espera a que se guarden. */
function pedirConfig() {
  configurando = true;
  return new Promise((resolve) => {
    const anterior = leerConfig() ?? {};
    const config = new BrowserWindow({
      width: 560, height: 560, resizable: false, title: 'Gestor de hobbies · Configuración',
      backgroundColor: '#0f1218', icon: path.join(__dirname, 'build', 'icon.png'),
      webPreferences: { preload: path.join(__dirname, 'preload.js') },
    });
    let guardado = false;
    ipcMain.handleOnce('config:datos', () => ({
      url: anterior.DB_URL ?? '', usuario: anterior.DB_USER ?? '', hayContrasena: Boolean(anterior.DB_PASSWORD),
    }));
    ipcMain.handleOnce('config:guardar', (_evento, datos) => {
      guardarConfig({ ...datos, contrasena: datos.contrasena || anterior.DB_PASSWORD || '' });
      guardado = true;
      config.close();
    });
    config.on('closed', () => {
      ipcMain.removeHandler('config:datos');
      ipcMain.removeHandler('config:guardar');
      configurando = false;
      resolve(guardado);
    });
    config.loadFile(path.join(__dirname, 'pantallas', 'configuracion.html'));
  });
}

// ---------- Backend ----------

function arrancarBackend(puerto) {
  const log = fs.createWriteStream(archivoLog(), { flags: 'w' });
  backend = spawn(rutaJava(), ['-jar', rutaJar()], {
    cwd: carpetaDatos(), // Spring lee el .env de esta carpeta
    env: { ...process.env, PORT: String(puerto), SERVER_ADDRESS: '127.0.0.1' },
    windowsHide: true,
  });
  backend.stdout.pipe(log);
  backend.stderr.pipe(log);
  return new Promise((resolve, reject) => {
    backend.on('error', (e) => reject(new Error(`No se pudo ejecutar Java: ${e.message}`)));
    backend.on('exit', (codigo) => {
      backend = null;
      if (!saliendo) reject(new Error(`El backend se ha cerrado (código ${codigo}).`));
    });
    esperarBackend(puerto).then(resolve, reject);
  });
}

function esperarBackend(puerto, segundos = 120) {
  const limite = Date.now() + segundos * 1000;
  return new Promise((resolve, reject) => {
    const probar = () => {
      if (!backend) return;
      const peticion = http.get({ host: '127.0.0.1', port: puerto, path: '/api/perfil', timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else reintentar();
      });
      peticion.on('error', reintentar);
      peticion.on('timeout', () => peticion.destroy());
    };
    const reintentar = () => {
      if (Date.now() > limite) reject(new Error('El backend no ha respondido a tiempo.'));
      else setTimeout(probar, 700);
    };
    probar();
  });
}

function pararBackend() {
  saliendo = true;
  if (backend) backend.kill();
}

/** Las últimas líneas del registro, para explicar qué ha fallado. */
function finalDelLog() {
  try {
    const lineas = fs.readFileSync(archivoLog(), 'utf8').split(/\r?\n/);
    const motivo = lineas.filter((l) => /FATAL|Caused by|APPLICATION FAILED|Description:|password|Connection/i.test(l)).slice(-3);
    return motivo.length ? motivo.join('\n') : lineas.slice(-6).join('\n');
  } catch {
    return '';
  }
}

// ---------- Ventana ----------

async function iniciar() {
  Menu.setApplicationMenu(null);

  if (!leerConfig()?.DB_URL && !(await pedirConfig())) {
    app.quit();
    return;
  }

  ventana = new BrowserWindow({
    width: 1360, height: 880, minWidth: 900, minHeight: 600, title: 'Gestor de hobbies',
    backgroundColor: '#0f1218', icon: path.join(__dirname, 'build', 'icon.png'), show: false,
  });
  ventana.once('ready-to-show', () => ventana.show());
  // Los enlaces externos (MFC, tiendas) se abren en el navegador normal.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await ventana.loadFile(path.join(__dirname, 'pantallas', 'cargando.html'));

  try {
    const puerto = await puertoLibre();
    await arrancarBackend(puerto);
    await ventana.loadURL(URL_DESARROLLO ?? `http://127.0.0.1:${puerto}/`);
  } catch (e) {
    const { response } = await dialog.showMessageBox(ventana, {
      type: 'error',
      title: 'Gestor de hobbies',
      message: 'No se ha podido arrancar la aplicación',
      detail: `${e.message}\n\n${finalDelLog()}\n\nRegistro completo: ${archivoLog()}`,
      buttons: ['Cambiar conexión a la base de datos', 'Abrir el registro', 'Salir'],
      defaultId: 0,
    });
    pararBackend();
    if (response === 0) {
      ventana.hide();
      if (await pedirConfig()) {
        app.relaunch();
      }
      app.exit(0);
    } else {
      if (response === 1) await shell.openPath(archivoLog());
      app.exit(1);
    }
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (ventana) {
      if (ventana.isMinimized()) ventana.restore();
      ventana.focus();
    }
  });
  app.whenReady().then(iniciar);
  app.on('window-all-closed', () => {
    if (!configurando) app.quit();
  });
  app.on('before-quit', pararBackend);
}
