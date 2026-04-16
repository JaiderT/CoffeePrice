import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

const TAGS = [
  { value: 'precio_justo', label: 'Precio justo' },
  { value: 'pago_puntual', label: 'Pago puntual' },
  { value: 'buen_trato', label: 'Buen trato' },
  { value: 'precio_real', label: 'Precio real' },
  { value: 'confiable', label: 'Confiable' },
  { value: 'bascula_justa', label: 'Báscula justa' },
];

export default function PerfilAdmin() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario, actualizarUsuario } = useAuth();
  const token = localStorage.getItem('token');

  const [pestana, setPestana] = useState('perfil');
  const [modo, setModo] = useState('ver');
  const [datos, setDatos] = useState({ nombre: '', apellido: '', celular: '' });
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [usuarios, setUsuarios] = useState([]);
  const [compradores, setCompradores] = useState([]);
  const [reseñas, setReseñas] = useState([]);
  const [reseñasPlataforma, setReseñasPlataforma] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoReseñas, setCargandoReseñas] = useState(false);
  const [cargandoPlataforma, setCargandoPlataforma] = useState(false);
  const [cargandoNoticias, setCargandoNoticias] = useState(false);
  const [filtroUsuarios, setFiltroUsuarios] = useState('todos');
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalEliminarReseña, setModalEliminarReseña] = useState(null);
  const [modalEliminarPlataforma, setModalEliminarPlataforma] = useState(null);
  const [modalEliminarNoticia, setModalEliminarNoticia] = useState(null);
  const [mostrarFormNoticia, setMostrarFormNoticia] = useState(false);
  const [noticiaEditar, setNoticiaEditar] = useState(null);
  const [formNoticia, setFormNoticia] = useState({
    titulo: '', resumen: '', contenido: '', categoria: 'mercado', fuente: '', imagen: ''
  });

  useEffect(() => {
    if (usuario) {
      setDatos({ nombre: usuario.nombre || '', apellido: usuario.apellido || '', celular: usuario.celular || '' });
    }
  }, [usuario]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const obtenerUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(data);
    } catch {
      mostrarMensaje('error', 'Error al obtener usuarios');
    } finally {
      setCargando(false);
    }
  }, [API_URL, token]);

  const obtenerCompradores = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/comprador`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompradores(data);
    } catch {
      mostrarMensaje('error', 'Error al obtener compradores');
    }
  }, [API_URL, token]);

  const obtenerTodasReseñas = useCallback(async () => {
    setCargandoReseñas(true);
    try {
      const compradoresRes = await axios.get(`${API_URL}/api/comprador`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const todasReseñas = [];
      for (const comp of compradoresRes.data) {
        const { data } = await axios.get(`${API_URL}/api/resenas/comprador/${comp._id}`);
        if (data.reseñas?.length > 0) {
          data.reseñas.forEach(r => todasReseñas.push({ ...r, compradorNombre: comp.nombreempresa }));
        }
      }
      setReseñas(todasReseñas);
    } catch {
      mostrarMensaje('error', 'Error al obtener reseñas');
    } finally {
      setCargandoReseñas(false);
    }
  }, [API_URL, token]);

  const obtenerReseñasPlataforma = useCallback(async () => {
    setCargandoPlataforma(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/resenas-plataforma/todas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReseñasPlataforma(data);
    } catch {
      mostrarMensaje('error', 'Error al obtener reseñas de plataforma');
    } finally {
      setCargandoPlataforma(false);
    }
  }, [API_URL, token]);

  const obtenerNoticias = useCallback(async () => {
    setCargandoNoticias(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/noticias`);
      setNoticias(data);
    } catch {
      mostrarMensaje('error', 'Error al obtener noticias');
    } finally {
      setCargandoNoticias(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (pestana === 'gestion') {
      obtenerUsuarios();
      obtenerCompradores();
    }
    if (pestana === 'resenas') {
      obtenerTodasReseñas();
      obtenerReseñasPlataforma();
    }
    if (pestana === 'noticias') {
      obtenerNoticias();
    }
  }, [pestana, obtenerUsuarios, obtenerCompradores, obtenerTodasReseñas, obtenerReseñasPlataforma, obtenerNoticias]);

  const handleEliminarReseña = async () => {
    try {
      await axios.delete(`${API_URL}/api/resenas/${modalEliminarReseña}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Reseña eliminada correctamente');
      setModalEliminarReseña(null);
      obtenerTodasReseñas();
    } catch {
      mostrarMensaje('error', 'Error al eliminar reseña');
    }
  };

  const handleAprobarPlataforma = async (id) => {
    try {
      await axios.put(`${API_URL}/api/resenas-plataforma/${id}/aprobar`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje('exito', 'Reseña aprobada correctamente');
      obtenerReseñasPlataforma();
    } catch {
      mostrarMensaje('error', 'Error al aprobar reseña');
    }
  };

  const handleEliminarPlataforma = async () => {
    try {
      await axios.delete(`${API_URL}/api/resenas-plataforma/${modalEliminarPlataforma}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Reseña eliminada correctamente');
      setModalEliminarPlataforma(null);
      obtenerReseñasPlataforma();
    } catch {
      mostrarMensaje('error', 'Error al eliminar reseña');
    }
  };

  const handleGuardarNoticia = async (e) => {
    e.preventDefault();
    try {
      if (noticiaEditar) {
        await axios.put(`${API_URL}/api/noticias/${noticiaEditar._id}`, formNoticia, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarMensaje('exito', 'Noticia actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/api/noticias`, formNoticia, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarMensaje('exito', 'Noticia publicada correctamente');
      }
      setMostrarFormNoticia(false);
      setNoticiaEditar(null);
      setFormNoticia({ titulo: '', resumen: '', contenido: '', categoria: 'mercado', fuente: '', imagen: '' });
      obtenerNoticias();
    } catch {
      mostrarMensaje('error', 'Error al guardar noticia');
    }
  };

  const handleEliminarNoticia = async () => {
    try {
      await axios.delete(`${API_URL}/api/noticias/${modalEliminarNoticia}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Noticia eliminada correctamente');
      setModalEliminarNoticia(null);
      obtenerNoticias();
    } catch {
      mostrarMensaje('error', 'Error al eliminar noticia');
    }
  };

  const abrirEditar = (noticia) => {
    setNoticiaEditar(noticia);
    setFormNoticia({
      titulo: noticia.titulo,
      resumen: noticia.resumen,
      contenido: noticia.contenido,
      categoria: noticia.categoria,
      fuente: noticia.fuente || '',
      imagen: noticia.imagen || '',
    });
    setMostrarFormNoticia(true);
  };

  const handleAprobarComprador = async (usuarioId) => {
    try {
      await axios.put(`${API_URL}/api/usuario/${usuarioId}/estado`,
        { estado: 'activo' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje('exito', 'Comprador aprobado correctamente');
      obtenerUsuarios();
      obtenerCompradores();
    } catch {
      mostrarMensaje('error', 'Error al aprobar comprador');
    }
  };

  const handleRechazarComprador = async (usuarioId) => {
    try {
      await axios.put(`${API_URL}/api/usuario/${usuarioId}/estado`,
        { estado: 'rechazado' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje('exito', 'Comprador rechazado');
      obtenerUsuarios();
      obtenerCompradores();
    } catch {
      mostrarMensaje('error', 'Error al rechazar comprador');
    }
  };

  const handleEliminarUsuario = async (id) => {
    if (!window.confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await axios.delete(`${API_URL}/api/usuario/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Usuario eliminado correctamente');
      obtenerUsuarios();
    } catch {
      mostrarMensaje('error', 'Error al eliminar usuario');
    }
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/usuario/perfil`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      actualizarUsuario(datos);
      mostrarMensaje('exito', 'Datos actualizados correctamente');
      setModo('ver');
    } catch {
      mostrarMensaje('error', 'Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) {
      mostrarMensaje('error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/usuario/password`, {
        passwordactual: passwords.actual,
        passwordnueva: passwords.nueva,
      }, { headers: { Authorization: `Bearer ${token}` } });
      mostrarMensaje('exito', 'Contraseña actualizada correctamente');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
      setModo('ver');
    } catch {
      mostrarMensaje('error', 'Contraseña actual incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const formatearFechaNoticia = (noticia) => {
    const fecha = noticia.publishedAt || noticia.createdAt;
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const estaActivo = (ultimaConexion) => {
    if (!ultimaConexion) return false;
    const diff = new Date() - new Date(ultimaConexion);
    return diff < 5 * 60 * 1000;
  };

  const renderEstrellas = (n) => (
    <span>
      <span className="text-[#C8A96E]">{'★'.repeat(Math.round(n))}</span>
      <span className="text-gray-300">{'★'.repeat(5 - Math.round(n))}</span>
    </span>
  );

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : '?';

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroUsuarios === 'todos') return true;
    return u.rol === filtroUsuarios || u.estado === filtroUsuarios;
  });

  const compradoresPendientes = usuarios.filter((u) => u.rol === 'comprador' && u.estado === 'pendiente');

  return (
    <div className="min-h-screen bg-[#F5ECD7] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-[#2C1A0E] rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#C8A96E] flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {iniciales}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{usuario?.nombre} {usuario?.apellido}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#C8A96E] text-[#2C1A0E] text-xs px-3 py-1 rounded-full font-bold">
                  ⚙️ Administrador
                </span>
                <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                  ● Activo
                </span>
              </div>
            </div>
          </div>
          {compradoresPendientes.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs px-4 py-2 rounded-xl font-semibold">
              ⚠️ {compradoresPendientes.length} comprador(es) pendiente(s)
            </div>
          )}
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* Pestañas */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setPestana('perfil')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pestana === 'perfil' ? 'bg-[#2C1A0E] text-white' : 'bg-white text-[#2C1A0E] hover:bg-[#E0D0B0]'}`}>
            <i className="fa-solid fa-user mr-2"></i>Mi perfil
          </button>
          <button onClick={() => setPestana('gestion')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${pestana === 'gestion' ? 'bg-[#2C1A0E] text-white' : 'bg-white text-[#2C1A0E] hover:bg-[#E0D0B0]'}`}>
            <i className="fa-solid fa-users-gear"></i>
            Gestionar usuarios
            {compradoresPendientes.length > 0 && (
              <span className="bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {compradoresPendientes.length}
              </span>
            )}
          </button>
          <button onClick={() => setPestana('resenas')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${pestana === 'resenas' ? 'bg-[#2C1A0E] text-white' : 'bg-white text-[#2C1A0E] hover:bg-[#E0D0B0]'}`}>
            <i className="fa-solid fa-star"></i>
            Gestionar reseñas
            {reseñasPlataforma.filter(r => !r.aprobada).length > 0 && (
              <span className="bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {reseñasPlataforma.filter(r => !r.aprobada).length}
              </span>
            )}
          </button>
          <button onClick={() => setPestana('noticias')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${pestana === 'noticias' ? 'bg-[#2C1A0E] text-white' : 'bg-white text-[#2C1A0E] hover:bg-[#E0D0B0]'}`}>
            <i className="fa-solid fa-newspaper"></i>
            Noticias
          </button>
        </div>

        {/* PESTAÑA PERFIL */}
        {pestana === 'perfil' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[#2C1A0E] font-bold">Información personal</h3>
              {modo === 'ver' && (
                <button onClick={() => setModo('editar')}
                  className="bg-[#F5ECD7] text-[#2C1A0E] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E0D0B0] transition-colors">
                  <i className="fa-solid fa-pen mr-2"></i>Editar
                </button>
              )}
            </div>
            <div className="px-8 py-6">
              {modo === 'ver' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Nombre</span>
                    <span className="text-[#2C1A0E] text-sm font-medium">{usuario?.nombre}</span>
                    <div className="h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Apellido</span>
                    <span className="text-[#2C1A0E] text-sm font-medium">{usuario?.apellido}</span>
                    <div className="h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Correo electrónico</span>
                    <span className="text-[#2C1A0E] text-sm font-medium">{usuario?.email}</span>
                    <div className="h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Celular</span>
                    <span className="text-[#2C1A0E] text-sm font-medium">{usuario?.celular || 'No registrado'}</span>
                    <div className="h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase">Rol</span>
                    <span className="text-[#2C1A0E] text-sm font-medium">Administrador</span>
                    <div className="h-px bg-gray-100" />
                  </div>
                  <button onClick={() => setModo('password')}
                    className="mt-4 w-full border border-[#C8A96E]/40 text-[#7A4020] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F5ECD7] transition-colors">
                    <i className="fa-solid fa-lock mr-2"></i>Cambiar contraseña
                  </button>
                </div>
              )}
              {modo === 'editar' && (
                <form onSubmit={handleGuardarDatos} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Nombre</label>
                    <input type="text" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Apellido</label>
                    <input type="text" value={datos.apellido} onChange={e => setDatos({ ...datos, apellido: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Celular</label>
                    <input type="text" value={datos.celular} onChange={e => setDatos({ ...datos, celular: e.target.value })}
                      placeholder="+57 300 000 0000"
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModo('ver')}
                      className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              )}
              {modo === 'password' && (
                <form onSubmit={handleCambiarPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Contraseña actual</label>
                    <input type="password" value={passwords.actual} onChange={e => setPasswords({ ...passwords, actual: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Nueva contraseña</label>
                    <input type="password" value={passwords.nueva} onChange={e => setPasswords({ ...passwords, nueva: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Confirmar nueva contraseña</label>
                    <input type="password" value={passwords.confirmar} onChange={e => setPasswords({ ...passwords, confirmar: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setModo('ver')}
                      className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors disabled:opacity-60">
                      {loading ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA GESTIÓN USUARIOS */}
        {pestana === 'gestion' && (
          <div className="space-y-6">
            {compradoresPendientes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-bold">
                    ⚠️ Pendientes de aprobación
                  </span>
                  <span className="text-gray-400 text-sm">{compradoresPendientes.length} comprador(es)</span>
                </div>
                <div className="p-4 space-y-3">
                  {compradoresPendientes.map((u, i) => {
                    const comp = compradores.find(c => c.usuario?._id === u._id || c.usuario === u._id);
                    return (
                      <div key={i} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                        <div>
                          <p className="font-semibold text-[#2C1A0E] text-sm">{u.nombre} {u.apellido}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                          {comp && <p className="text-[#C8A96E] text-xs font-semibold mt-1">🏢 {comp.nombreempresa}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAprobarComprador(u._id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors">
                            ✓ Aprobar
                          </button>
                          <button onClick={() => handleRechazarComprador(u._id)}
                            className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                            ✕ Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[#2C1A0E] font-bold">Todos los usuarios</h3>
                <div className="flex gap-2">
                  {['todos', 'productor', 'comprador', 'admin'].map(f => (
                    <button key={f} onClick={() => setFiltroUsuarios(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filtroUsuarios === f ? 'bg-[#2C1A0E] text-white' : 'bg-[#F5ECD7] text-[#2C1A0E] hover:bg-[#E0D0B0]'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {cargando ? (
                <div className="text-center py-8 text-gray-400">Cargando usuarios...</div>
              ) : (
                <div className="p-4 space-y-2">
                  {usuariosFiltrados.map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F5ECD7]/50 rounded-xl hover:bg-[#F5ECD7] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#C8A96E] flex items-center justify-center text-white text-xs font-bold">
                          {u.nombre?.[0]}{u.apellido?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#2C1A0E] text-sm">{u.nombre} {u.apellido}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : u.rol === 'comprador' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {u.rol}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${u.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                            u.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                              estaActivo(u.ultimaConexion) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {u.estado === 'pendiente' ? '⏳ Pendiente' :
                            u.estado === 'rechazado' ? '✕ Rechazado' :
                              estaActivo(u.ultimaConexion) ? '● En línea' : '○ Ausente'}
                        </span>
                        {u._id !== usuario?.id && (
                          <button onClick={() => handleEliminarUsuario(u._id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1">
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA RESEÑAS */}
        {pestana === 'resenas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[#2C1A0E] font-bold">Reseñas de compradores</h3>
                <span className="bg-[#F5ECD7] text-[#2C1A0E] text-xs px-3 py-1 rounded-full font-semibold">
                  {reseñas.length} reseñas
                </span>
              </div>
              {cargandoReseñas ? (
                <div className="text-center py-8 text-gray-400">Cargando reseñas...</div>
              ) : reseñas.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-star text-gray-200 text-4xl mb-3"></i>
                  <p className="text-gray-400 text-sm">No hay reseñas aún</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {reseñas.map((r, i) => (
                    <div key={i} className="bg-[#F5ECD7]/50 rounded-xl p-4 hover:bg-[#F5ECD7] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#C8A96E] bg-[#FFF8E7] px-2 py-0.5 rounded-full border border-[#C8A96E]/30">
                              🏢 {r.compradorNombre}
                            </span>
                            <div className="text-sm">{renderEstrellas(r.calificacion)}</div>
                          </div>
                          <p className="text-[#2C1A0E] text-sm font-semibold">{r.productor?.nombre} {r.productor?.apellido}</p>
                          <p className="text-gray-400 text-xs mb-2">
                            {new Date(r.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {r.comentario && <p className="text-[#6B5A4D] text-sm mb-2">{r.comentario}</p>}
                          {r.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {r.tags.map((tag, j) => (
                                <span key={j} className="bg-[#FFF8E7] text-[#7A4020] text-xs px-2 py-0.5 rounded-full border border-[#C8A96E]/30">
                                  {TAGS.find(t => t.value === tag)?.label || tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => setModalEliminarReseña(r._id)}
                          className="ml-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <i className="fa-solid fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[#2C1A0E] font-bold">Reseñas de la plataforma</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold">
                    {reseñasPlataforma.filter(r => !r.aprobada).length} pendientes
                  </span>
                  <span className="bg-[#F5ECD7] text-[#2C1A0E] text-xs px-3 py-1 rounded-full font-semibold">
                    {reseñasPlataforma.length} total
                  </span>
                </div>
              </div>
              {cargandoPlataforma ? (
                <div className="text-center py-8 text-gray-400">Cargando reseñas...</div>
              ) : reseñasPlataforma.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-star text-gray-200 text-4xl mb-3"></i>
                  <p className="text-gray-400 text-sm">No hay reseñas de la plataforma aún</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {reseñasPlataforma.map((r, i) => (
                    <div key={i} className={`rounded-xl p-4 transition-colors ${r.aprobada ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${r.aprobada ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                              {r.aprobada ? '✓ Aprobada' : '⏳ Pendiente'}
                            </span>
                            <div className="text-sm">{renderEstrellas(r.calificacion)}</div>
                          </div>
                          <p className="text-[#2C1A0E] text-sm font-semibold">
                            {r.usuario?.nombre} {r.usuario?.apellido}
                            <span className="text-gray-400 text-xs font-normal ml-2">· {r.usuario?.rol}</span>
                          </p>
                          {r.lugar && <p className="text-gray-400 text-xs">{r.lugar}</p>}
                          <p className="text-gray-400 text-xs mb-2">
                            {new Date(r.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[#6B5A4D] text-sm">{r.comentario}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {!r.aprobada && (
                            <button onClick={() => handleAprobarPlataforma(r._id)}
                              className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                              ✓ Aprobar
                            </button>
                          )}
                          <button onClick={() => setModalEliminarPlataforma(r._id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-center">
                            <i className="fa-solid fa-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA NOTICIAS */}
        {pestana === 'noticias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Gestionar noticias</h3>
              <button
                onClick={() => { setNoticiaEditar(null); setFormNoticia({ titulo: '', resumen: '', contenido: '', categoria: 'mercado', fuente: '', imagen: '' }); setMostrarFormNoticia(true); }}
                className="bg-[#C8A96E] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> Nueva noticia
              </button>
            </div>

            {cargandoNoticias ? (
              <div className="text-center py-8 text-gray-400">Cargando noticias...</div>
            ) : noticias.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <i className="fa-solid fa-newspaper text-gray-200 text-4xl mb-3"></i>
                <p className="text-gray-400 text-sm">No hay noticias publicadas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {noticias.map((n) => (
                  <div key={n._id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    {n.imagen ? (
                      <img src={n.imagen} alt={n.titulo} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#F5ECD7] flex items-center justify-center shrink-0 text-2xl">
                        📰
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#C8A96E] border border-[#C8A96E]/30 font-semibold capitalize">
                          {n.categoria}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatearFechaNoticia(n)}
                        </span>
                      </div>
                      <p className="text-[#2C1A0E] font-semibold text-sm leading-snug truncate">{n.titulo}</p>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{n.resumen}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[11px] text-[#8B6B45] font-semibold">
                          {n.fuente || 'CoffePrice'}
                        </span>
                        {n.tipoImagen && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            {n.tipoImagen === 'source' ? 'Imagen de fuente' : 'Imagen de apoyo'}
                          </span>
                        )}
                      </div>
                      {n.sourceUrl && (
                        <a href={n.sourceUrl} target="_blank" rel="noreferrer"
                          className="inline-flex mt-2 text-[11px] font-semibold text-[#6B3A2A] hover:text-[#2C1A0E]">
                          Abrir fuente original
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => abrirEditar(n)}
                        className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button onClick={() => setModalEliminarNoticia(n._id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-center">
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal crear/editar noticia */}
      {mostrarFormNoticia && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">
                {noticiaEditar ? 'Editar noticia' : 'Nueva noticia'}
              </h3>
              <button onClick={() => setMostrarFormNoticia(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleGuardarNoticia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Título</label>
                <input type="text" required value={formNoticia.titulo}
                  onChange={e => setFormNoticia({ ...formNoticia, titulo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]"
                  placeholder="Título de la noticia" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Categoría</label>
                <select value={formNoticia.categoria}
                  onChange={e => setFormNoticia({ ...formNoticia, categoria: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="mercado">📈 Precios del café</option>
                  <option value="internacional">🌎 Mercado internacional</option>
                  <option value="clima">🌧️ Clima y cosechas</option>
                  <option value="fnc">🏛️ Federación Cafeteros</option>
                  <option value="produccion">🌱 Producción</option>
                  <option value="consejos">💡 Consejos para caficultores</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Resumen</label>
                <textarea required value={formNoticia.resumen}
                  onChange={e => setFormNoticia({ ...formNoticia, resumen: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E] resize-none h-20"
                  placeholder="Resumen breve de la noticia" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Contenido</label>
                <textarea required value={formNoticia.contenido}
                  onChange={e => setFormNoticia({ ...formNoticia, contenido: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E] resize-none h-32"
                  placeholder="Contenido completo de la noticia" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Fuente (opcional)</label>
                <input type="text" value={formNoticia.fuente}
                  onChange={e => setFormNoticia({ ...formNoticia, fuente: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]"
                  placeholder="Ej: FNC Colombia" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">URL de imagen (opcional)</label>
                <input type="text" value={formNoticia.imagen}
                  onChange={e => setFormNoticia({ ...formNoticia, imagen: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]"
                  placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarFormNoticia(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  {noticiaEditar ? 'Guardar cambios' : 'Publicar noticia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar reseña comprador */}
      {modalEliminarReseña && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar reseña?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminarReseña(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminarReseña}
                className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar reseña plataforma */}
      {modalEliminarPlataforma && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar reseña?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminarPlataforma(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminarPlataforma}
                className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar noticia */}
      {modalEliminarNoticia && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-newspaper text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar noticia?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminarNoticia(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminarNoticia}
                className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}