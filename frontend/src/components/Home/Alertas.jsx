import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';

const CATEGORIAS = [
  { value: 'mercado', label: 'Precios del café', emoji: '📈' },
  { value: 'internacional', label: 'Mercado internacional', emoji: '🌎' },
  { value: 'clima', label: 'Clima y cosechas', emoji: '🌧️' },
  { value: 'fnc', label: 'Federación Cafeteros', emoji: '🏛️' },
  { value: 'produccion', label: 'Producción', emoji: '🌱' },
  { value: 'consejos', label: 'Consejos para caficultores', emoji: '💡' },
  { value: 'el_pital', label: 'Noticias de El Pital', emoji: '⛰️' },
];

function Alertas() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuarioId');

  const [alertas, setAlertas] = useState([]);
  const [alertaNoticia, setAlertaNoticia] = useState(null);
  const [compradores, setCompradores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarFormNoticia, setMostrarFormNoticia] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [pestana, setPestana] = useState('precios');
  const [form, setForm] = useState({
    comprador: '',
    precioMinimo: '',
    canales: { push: true, email: false, whatsapp: false },
  });
  const [formNoticia, setFormNoticia] = useState({
    categorias: [],
    canales: { push: true, email: false },
  });

  useEffect(() => {
    obtenerAlertas();
    obtenerAlertaNoticia();
    obtenerCompradores();
  }, []);

  const obtenerAlertas = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/alertas/usuario/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertas(data);
    } catch (error) {
      console.error('Error al obtener alertas:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerAlertaNoticia = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/alertas-noticias/usuario/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertaNoticia(data);
      if (data) {
        setFormNoticia({
          categorias: data.categorias || [],
          canales: data.canales || { push: true, email: false },
        });
      }
    } catch { /* silencioso */ }
  };

  const obtenerCompradores = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios`);
      const unicos = [];
      const ids = new Set();
      data.forEach(p => {
        if (p.comprador && !ids.has(p.comprador._id)) {
          ids.add(p.comprador._id);
          unicos.push(p.comprador);
        }
      });
      setCompradores(unicos);
    } catch (error) {
      console.error('Error al obtener compradores:', error);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/alertas`, {
        comprador: form.comprador || null,
        precioMinimo: Number(form.precioMinimo),
        canales: form.canales,
      }, { headers: { Authorization: `Bearer ${token}` } });
      mostrarMensaje('exito', '¡Alerta creada correctamente!');
      setMostrarForm(false);
      setForm({ comprador: '', precioMinimo: '', canales: { push: true, email: false, whatsapp: false } });
      obtenerAlertas();
    } catch {
      mostrarMensaje('error', 'Error al crear la alerta');
    }
  };

  const handleGuardarAlertaNoticia = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/alertas-noticias`, {
        categorias: formNoticia.categorias,
        canales: formNoticia.canales,
        activa: true,
      }, { headers: { Authorization: `Bearer ${token}` } });
      mostrarMensaje('exito', '¡Alerta de noticias guardada!');
      setMostrarFormNoticia(false);
      obtenerAlertaNoticia();
    } catch {
      mostrarMensaje('error', 'Error al guardar la alerta de noticias');
    }
  };

  const handleToggleNoticia = async () => {
    try {
      await axios.put(`${API_URL}/api/alertas-noticias/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      obtenerAlertaNoticia();
    } catch {
      mostrarMensaje('error', 'Error al cambiar estado');
    }
  };

  const handleEliminarNoticia = async () => {
    try {
      await axios.delete(`${API_URL}/api/alertas-noticias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertaNoticia(null);
      localStorage.removeItem('coffeprice_alertas');
      mostrarMensaje('exito', 'Alerta de noticias eliminada');
    } catch {
      mostrarMensaje('error', 'Error al eliminar la alerta');
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.put(`${API_URL}/api/alertas/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      obtenerAlertas();
    } catch {
      mostrarMensaje('error', 'Error al cambiar estado de la alerta');
    }
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(`${API_URL}/api/alertas/${modalEliminar}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarMensaje('exito', 'Alerta eliminada correctamente');
      setModalEliminar(null);
      obtenerAlertas();
    } catch {
      mostrarMensaje('error', 'Error al eliminar la alerta');
    }
  };

  const toggleCategoria = (cat) => {
    setFormNoticia(prev => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter(c => c !== cat)
        : [...prev.categorias, cat]
    }));
  };

  const alertasActivas = alertas.filter(a => a.activa);
  const alertasInactivas = alertas.filter(a => !a.activa);

  return (
    <div className="min-h-screen bg-[#F7F1E3]">

      {/* Header */}
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-5 border-b border-[#E7D9BF] bg-[linear-gradient(180deg,#F7EEDC_0%,#F7F1E3_100%)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#2C1A0E] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5ECD7]">
              Alertas
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-[#2C1A0E]">
              Mis alertas
            </h1>
            <p className="mt-2 text-sm text-[#6B5A4D]">
              Gestiona tus alertas de precios y noticias del café.
            </p>
          </div>
          <button onClick={() => {
            if (pestana === 'noticias') {
              setMostrarFormNoticia(true);
              } else {
                setMostrarForm(true);
              }
            }}
              className="bg-[#C8A96E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-2"><i className="fa-solid fa-plus"></i> Nueva alerta
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="px-5 md:px-8 pt-5 flex gap-2 border-b border-[#E7D9BF]">
        {[
          { key: 'precios', label: '💰 Alertas de precios', count: alertas.length },
          { key: 'noticias', label: '📰 Alertas de noticias', count: alertaNoticia ? 1 : 0 },
        ].map(p => (
          <button key={p.key} onClick={() => setPestana(p.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors -mb-px flex items-center gap-2 ${
              pestana === p.key
                ? 'bg-white border border-b-white border-[#E7D9BF] text-[#2C1A0E]'
                : 'text-gray-400 hover:text-[#2C1A0E]'
            }`}>
            {p.label}
            {p.count > 0 && (
              <span className="bg-[#C8A96E] text-white text-xs px-1.5 py-0.5 rounded-full">{p.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 md:px-8 py-6">

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        {/* PESTAÑA PRECIOS */}
        {pestana === 'precios' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl bg-[#2C1A0E] p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#D8C7A8]">Total alertas</p>
                <p className="mt-3 text-2xl font-bold text-[#F8F2E8]">{alertas.length}</p>
              </div>
              <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">Activas</p>
                <p className="mt-3 text-2xl font-bold text-green-600">{alertasActivas.length}</p>
              </div>
              <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">Inactivas</p>
                <p className="mt-3 text-2xl font-bold text-gray-400">{alertasInactivas.length}</p>
              </div>
            </div>

            {cargando ? (
              <div className="text-center py-12 text-[#8B7355]">Cargando alertas...</div>
            ) : alertas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7D9BF] p-12 text-center shadow-sm">
                <i className="fa-solid fa-bell text-gray-200 text-5xl mb-4"></i>
                <p className="text-[#2C1A0E] font-semibold text-lg">No tienes alertas de precios</p>
                <p className="text-[#8B7355] text-sm mt-2 mb-6">Crea una alerta y te avisamos cuando el precio suba</p>
                <button onClick={() => setMostrarForm(true)}
                  className="bg-[#2C1A0E] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  <i className="fa-solid fa-plus mr-2"></i>Crear primera alerta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((alerta, i) => (
                  <div key={i} className={`rounded-2xl border p-5 shadow-sm transition-all ${alerta.activa ? 'bg-white border-[#E7D9BF]' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${alerta.activa ? 'bg-[#FFF8E7]' : 'bg-gray-100'}`}>
                          🔔
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${alerta.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {alerta.activa ? '● Activa' : '○ Inactiva'}
                            </span>
                            {!alerta.comprador && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                                Todos los compradores
                              </span>
                            )}
                          </div>
                          <p className="text-[#2C1A0E] font-bold text-base">
                            {alerta.comprador?.nombreempresa || 'Cualquier comprador'}
                          </p>
                          <p className="text-[#8B7355] text-sm mt-0.5">
                            Avisar cuando el precio supere{' '}
                            <span className="font-bold text-[#C8A96E]">
                              ${Number(alerta.precioMinimo).toLocaleString()}
                            </span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            {alerta.canales?.push && <span className="text-xs bg-[#F7F1E3] text-[#6B5A4D] px-2 py-0.5 rounded-full border border-[#E7D9BF]">🔔 Push</span>}
                            {alerta.canales?.email && <span className="text-xs bg-[#F7F1E3] text-[#6B5A4D] px-2 py-0.5 rounded-full border border-[#E7D9BF]">✉️ Email</span>}
                            {alerta.canales?.whatsapp && <span className="text-xs bg-[#F7F1E3] text-[#6B5A4D] px-2 py-0.5 rounded-full border border-[#E7D9BF]">💬 WhatsApp</span>}
                          </div>
                          {alerta.ultimaNotificacion && (
                            <p className="text-xs text-gray-400 mt-1">
                              Última notificación: {new Date(alerta.ultimaNotificacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => handleToggle(alerta._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${alerta.activa ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {alerta.activa ? '⏸ Pausar' : '▶ Activar'}
                        </button>
                        <button onClick={() => setModalEliminar(alerta._id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-center">
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-[#2C1A0E]/5 border border-[#C8A96E]/20 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#7A4020] uppercase mb-3">¿Cómo funcionan las alertas de precio?</p>
              <div className="space-y-2 text-xs text-[#6B5A4D]">
                <p>🔔 <strong>Push:</strong> Notificación en el navegador cuando estés en la app</p>
                <p>✉️ <strong>Email:</strong> Correo automático a tu cuenta registrada</p>
                <p>💬 <strong>WhatsApp:</strong> Mensaje al número registrado en tu perfil</p>
              </div>
            </div>
          </>
        )}

        {/* PESTAÑA NOTICIAS */}
        {pestana === 'noticias' && (
          <>
            {!alertaNoticia ? (
              <div className="bg-white rounded-2xl border border-[#E7D9BF] p-12 text-center shadow-sm">
                <i className="fa-solid fa-newspaper text-gray-200 text-5xl mb-4"></i>
                <p className="text-[#2C1A0E] font-semibold text-lg">No tienes alertas de noticias</p>
                <p className="text-[#8B7355] text-sm mt-2 mb-6">Activa las alertas y te avisamos cuando haya noticias del café</p>
                <button onClick={() => setMostrarFormNoticia(true)}
                  className="bg-[#2C1A0E] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  <i className="fa-solid fa-plus mr-2"></i>Configurar alertas de noticias
                </button>
              </div>
            ) : (
              <div className={`rounded-2xl border p-5 shadow-sm ${alertaNoticia.activa ? 'bg-white border-[#E7D9BF]' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${alertaNoticia.activa ? 'bg-[#FFF8E7]' : 'bg-gray-100'}`}>
                      📰
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${alertaNoticia.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {alertaNoticia.activa ? '● Activa' : '○ Inactiva'}
                        </span>
                      </div>
                      <p className="text-[#2C1A0E] font-bold text-base">Alertas de noticias del café</p>
                      <p className="text-[#8B7355] text-sm mt-0.5">
                        {alertaNoticia.categorias?.length > 0
                          ? `Categorías: ${alertaNoticia.categorias.map(c => CATEGORIAS.find(x => x.value === c)?.emoji + ' ' + c).join(', ')}`
                          : 'Todas las categorías'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {alertaNoticia.canales?.push && <span className="text-xs bg-[#F7F1E3] text-[#6B5A4D] px-2 py-0.5 rounded-full border border-[#E7D9BF]">🔔 Push</span>}
                        {alertaNoticia.canales?.email && <span className="text-xs bg-[#F7F1E3] text-[#6B5A4D] px-2 py-0.5 rounded-full border border-[#E7D9BF]">✉️ Email</span>}
                      </div>
                      {alertaNoticia.ultimaNotificacion && (
                        <p className="text-xs text-gray-400 mt-1">
                          Última notificación: {new Date(alertaNoticia.ultimaNotificacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setMostrarFormNoticia(true)}
                      className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors">
                      ✏️ Editar
                    </button>
                    <button onClick={handleToggleNoticia}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${alertaNoticia.activa ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {alertaNoticia.activa ? '⏸ Pausar' : '▶ Activar'}
                    </button>
                    <button onClick={handleEliminarNoticia}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-center">
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 bg-[#2C1A0E]/5 border border-[#C8A96E]/20 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#7A4020] uppercase mb-3">¿Cómo funcionan las alertas de noticias?</p>
              <div className="space-y-2 text-xs text-[#6B5A4D]">
                <p>📰 Recibes una notificación cada vez que se publica una nueva noticia en las categorías que seguiste</p>
                <p>🔔 <strong>Push:</strong> Notificación en el navegador cuando estés en la app</p>
                <p>✉️ <strong>Email:</strong> Correo automático con el resumen de la noticia</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal crear alerta de precios */}
      {mostrarForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Nueva alerta de precio</h3>
              <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Comprador (opcional)</label>
                <select value={form.comprador}
                  onChange={e => setForm({ ...form, comprador: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="">Todos los compradores</option>
                  {compradores.map((c, i) => (
                    <option key={i} value={c._id}>{c.nombreempresa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-2">Precio mínimo (COP)</label>
                <input type="number" required value={form.precioMinimo}
                  onChange={e => setForm({ ...form, precioMinimo: e.target.value })}
                  placeholder="Ej: 2000000"
                  className="w-full px-4 py-3 rounded-xl border border-[#C8A96E]/30 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-3">Canales de notificación</label>
                <div className="space-y-2">
                  {[
                    { key: 'push', label: '🔔 Notificación push', desc: 'En el navegador' },
                    { key: 'email', label: '✉️ Correo electrónico', desc: usuario?.email },
                    { key: 'whatsapp', label: '💬 WhatsApp', desc: usuario?.celular || 'Agrega tu celular en el perfil' },
                  ].map(canal => (
                    <label key={canal.key} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${form.canales[canal.key] ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A0E]">{canal.label}</p>
                        <p className="text-xs text-gray-400">{canal.desc}</p>
                      </div>
                      <input type="checkbox" checked={form.canales[canal.key]}
                        onChange={e => setForm({ ...form, canales: { ...form.canales, [canal.key]: e.target.checked } })}
                        className="w-4 h-4 accent-[#C8A96E]" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  Crear alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal configurar alerta de noticias */}
      {mostrarFormNoticia && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Alertas de noticias</h3>
              <button onClick={() => setMostrarFormNoticia(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleGuardarAlertaNoticia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-3">Categorías (opcional)</label>
                <div className="space-y-2">
                  {CATEGORIAS.map(cat => (
                    <label key={cat.value} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${formNoticia.categorias.includes(cat.value) ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <p className="text-sm font-semibold text-[#2C1A0E]">{cat.label}</p>
                      </div>
                      <input type="checkbox" checked={formNoticia.categorias.includes(cat.value)}
                        onChange={() => toggleCategoria(cat.value)}
                        className="w-4 h-4 accent-[#C8A96E]" />
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Sin selección recibirás alertas de todas las categorías</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3B1F0A] mb-3">Canales</label>
                <div className="space-y-2">
                  {[
                    { key: 'push', label: '🔔 Push', desc: 'En el navegador' },
                    { key: 'email', label: '✉️ Email', desc: usuario?.email },
                  ].map(canal => (
                    <label key={canal.key} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${formNoticia.canales[canal.key] ? 'border-[#C8A96E] bg-[#FFF8E7]' : 'border-gray-200 bg-gray-50'}`}>
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A0E]">{canal.label}</p>
                        <p className="text-xs text-gray-400">{canal.desc}</p>
                      </div>
                      <input type="checkbox" checked={formNoticia.canales[canal.key]}
                        onChange={e => setFormNoticia({ ...formNoticia, canales: { ...formNoticia.canales, [canal.key]: e.target.checked } })}
                        className="w-4 h-4 accent-[#C8A96E]" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarFormNoticia(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#2C1A0E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3D1F0F] transition-colors">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar alerta de precio */}
      {modalEliminar && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar alerta?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
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

export default Alertas;
