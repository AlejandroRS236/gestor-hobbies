const formulario = document.getElementById('formulario');
const campos = ['url', 'usuario', 'contrasena'].map((id) => document.getElementById(id));
const [url, usuario, contrasena] = campos;
const error = document.getElementById('error');
let hayContrasena = false;

window.configuracion.datos().then((datos) => {
  url.value = datos.url;
  usuario.value = datos.usuario;
  hayContrasena = datos.hayContrasena;
  if (hayContrasena) contrasena.placeholder = 'Déjala vacía para mantener la actual';
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!url.value.trim().startsWith('jdbc:postgresql://')) {
    error.textContent = 'La dirección debe empezar por jdbc:postgresql://';
    return;
  }
  if (!contrasena.value && !hayContrasena) {
    error.textContent = 'Escribe la contraseña de la base de datos.';
    return;
  }
  await window.configuracion.guardar({
    url: url.value.trim(), usuario: usuario.value.trim(), contrasena: contrasena.value,
  });
});
