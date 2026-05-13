const SESSION_KEYS = ['token', 'rol', 'name', 'apellido', 'usuarioId', 'celular', 'email', 'estado'];

export function guardarUsuarioLocal(usuario) {
  if (!usuario) return;
  localStorage.setItem('rol', usuario.rol || '');
  localStorage.setItem('name', usuario.nombre || '');
  localStorage.setItem('apellido', usuario.apellido || '');
  localStorage.setItem('usuarioId', usuario.id || '');
  localStorage.setItem('celular', usuario.celular || '');
  localStorage.setItem('email', usuario.email || '');
  localStorage.setItem('estado', usuario.estado || '');
}

export function limpiarUsuarioLocal() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function leerUsuarioLocal() {
  const rol = localStorage.getItem('rol');
  const id = localStorage.getItem('usuarioId');
  if (!rol || !id) return null;

  return {
    id,
    rol,
    nombre: localStorage.getItem('name') || '',
    apellido: localStorage.getItem('apellido') || '',
    celular: localStorage.getItem('celular') || '',
    email: localStorage.getItem('email') || '',
    estado: localStorage.getItem('estado') || 'activo',
  };
}
