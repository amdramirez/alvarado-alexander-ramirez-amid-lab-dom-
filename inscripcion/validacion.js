const form = document.querySelector('#inscripcion');
const campoSede = document.querySelector('#campo-sede');
const confirmacion = document.querySelector('#confirmacion');
const contador = document.querySelector('#contador');
const fuerza = document.querySelector('#clave-fuerza');
const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

// Devuelve los requisitos de contraseña que faltan
function faltantesClave(v) {
  const f = [];
  if (v.length < 8) f.push('8 caracteres');
  if (!/[A-ZÁÉÍÓÚÑ]/.test(v)) f.push('una mayúscula');
  if (!/[a-záéíóúñ]/.test(v)) f.push('una minúscula');
  if (!/\d/.test(v)) f.push('un número');
  if (!/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(v)) f.push('un símbolo');
  return f;
}

// Reglas: reciben el valor y devuelven true o el mensaje de error
const reglas = {
  nombre: v => {
    const t = v.trim();
    return (t.length >= 5 && t.length <= 60 &&
      new RegExp(`^[${LETRAS}]+(\\s+[${LETRAS}]+)+$`).test(t)) || 'Escribe tu nombre y apellido.';
  },
  cedula: v => /^(?:[1-9]|1[0-3]|PE|E|N)-\d{1,4}-\d{1,6}$/i.test(v.trim()) || 'Usa el formato 8-123-4567.',
  correo: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Usa un correo como nombre@dominio.com.',
  celular: v => /^6\d{3}-?\d{4}$/.test(v.trim()) || 'El celular debe tener 8 dígitos y empezar con 6.',
  nacimiento: v => {
    if (!v) return 'Debes tener al menos 16 años.';
    const fecha = new Date(v), limite = new Date();
    limite.setFullYear(limite.getFullYear() - 16);
    return fecha <= limite || 'Debes tener al menos 16 años.';
  },
  curso: v => v !== '' || 'Elige un curso.',
  modalidad: v => v !== '' || 'Elige una modalidad.',
  sede: v => form.elements.modalidad.value !== 'presencial' || v !== '' || 'Elige una sede.',
  clave: v => { const f = faltantesClave(v); return f.length === 0 || `Te falta: ${f.join(', ')}.`; },
  clave2: v => v === form.elements.clave.value || 'Las contraseñas no coinciden.',
  comentarios: v => v.length <= 200 || 'Máximo 200 caracteres.',
  terminos: () => form.elements.terminos.checked || 'Debes aceptar los términos.',
};

// Una sola función aplica cualquier regla
function validarCampo(input) {
  const nombre = input.name;
  const valor = nombre === 'modalidad' ? form.elements.modalidad.value
              : nombre === 'terminos' ? String(input.checked) : input.value;
  const res = reglas[nombre](valor);
  const valido = res === true;
  const error = document.getElementById(`${nombre}-error`);
  const controles = nombre === 'modalidad' ? form.querySelectorAll('[name=modalidad]') : [input];
  controles.forEach(c => c.setAttribute('aria-invalid', String(!valido)));
  error.textContent = valido ? '' : res;
  return valido;
}

// Campos que se validan ahora mismo (sede solo si es presencial)
function camposActivos() {
  return Object.keys(reglas)
    .filter(n => n !== 'sede' || form.elements.modalidad.value === 'presencial')
    .map(n => form.querySelector(`[name=${n}]`));
}

// Patrón 3.4: blur -> en vivo -> submit
const tocados = new Set();
form.addEventListener('blur', e => {
  if (!reglas[e.target.name]) return;
  tocados.add(e.target.name);
  validarCampo(e.target);
}, true);

form.addEventListener('input', e => actualizarYValidar(e.target));
form.addEventListener('change', e => actualizarYValidar(e.target));

function actualizarYValidar(el) {
  const n = el.name;
  if (n === 'comentarios') actualizarContador();
  if (n === 'clave') { actualizarFuerza(); if (tocados.has('clave2')) validarCampo(form.elements.clave2); }
  if (n === 'modalidad') {
    const pres = form.elements.modalidad.value === 'presencial';
    campoSede.hidden = !pres;
    if (!pres) limpiarCampo(form.elements.sede);
    tocados.add('modalidad');
  }
  if (tocados.has(n)) validarCampo(el);
}

function limpiarCampo(input) {
  input.value = '';
  input.removeAttribute('aria-invalid');
  document.getElementById(`${input.name}-error`).textContent = '';
  tocados.delete(input.name);
}

function actualizarContador() {
  const n = form.elements.comentarios.value.length;
  contador.textContent = `${n} / 200`;
  contador.classList.toggle('alerta', n > 180 && n <= 200);
  contador.classList.toggle('excedido', n > 200);
}

function actualizarFuerza() {
  const v = form.elements.clave.value;
  const nivel = v ? 5 - faltantesClave(v).length : 0;
  const etiquetas = ['—', 'Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte'];
  fuerza.dataset.nivel = nivel;
  fuerza.textContent = `Fuerza: ${etiquetas[nivel]}`;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const invalidos = camposActivos().filter(el => !validarCampo(el));
  camposActivos().forEach(el => tocados.add(el.name));
  if (invalidos.length) { invalidos[0].focus(); return; }
  mostrarConfirmacion(new FormData(form));
  form.reset();
  campoSede.hidden = true;
  tocados.clear();
  form.querySelectorAll('[aria-invalid]').forEach(c => c.removeAttribute('aria-invalid'));
  actualizarContador();
  actualizarFuerza();
});

// Tarjeta creada con createElement; datos con textContent (sin contraseña)
function mostrarConfirmacion(datos) {
  const etiquetas = { nombre: 'Nombre', cedula: 'Cédula', correo: 'Correo', celular: 'Celular',
    nacimiento: 'Nacimiento', curso: 'Curso', modalidad: 'Modalidad', sede: 'Sede', comentarios: 'Comentarios' };
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta';
  const h2 = document.createElement('h2');
  h2.textContent = '¡Inscripción recibida!';
  const dl = document.createElement('dl');
  for (const [campo, etiqueta] of Object.entries(etiquetas)) {
    const valor = datos.get(campo);
    if (!valor) continue;
    const dt = document.createElement('dt'); dt.textContent = etiqueta;
    const dd = document.createElement('dd'); dd.textContent = valor;
    dl.append(dt, dd);
  }
  tarjeta.append(h2, dl);
  confirmacion.replaceChildren(tarjeta);
}
