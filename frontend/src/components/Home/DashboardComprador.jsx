import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContex.jsx';

function DashboardComprador() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();
  const [precios, setPrecios] = useState([]);
  const [comprador, setComprador] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [mostrarHorario, setMostrarHorario] = useState(false);
  const [precioEditar, setPrecioEditar] = useState(null);
  const [precioEliminar, setPrecioEliminar] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState({ preciocarga: '', tipocafe: 'pergamino_seco' });
  const [horarioForm, setHorarioForm] = useState({ horarioApertura: '08:00', horarioCierre: '17:00' });
  const [mensaje, setMensaje] = useState(null);

  const obtenerPrecios = async (compradorId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const obtenerComprador = async () => {
      try {
        const token = localStorage.getItem('token');
        const usuarioId = usuario?.id;
        if (!usuarioId) { setCargando(false); return; }
        const { data } = await axios.get(
          `${API_URL}/api/comprador/usuario/${usuarioId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComprador(data);
        setHorarioForm({
          horarioApertura: data.horarioApertura || '08:00',
          horarioCierre: data.horarioCierre || '17:00',
        });
        await obtenerPrecios(data._id);
      } catch (error) {
        console.error('Error al obtener comprador:', error);
        setCargando(false);
      }
    };
    obtenerComprador();
  }, [API_URL, usuario?.id]);

  const handlePublicar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/precios`,
        { ...nuevoPrecio, preciocarga: Number(nuevoPrecio.preciocarga), comprador: comprador._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje({ tipo: 'exito', texto: '¡Precio publicado exitosamente!' });
      setMostrarFormulario(false);
      setNuevoPrecio({ preciocarga: '', tipocafe: 'pergamino_seco' });
      obtenerPrecios(comprador._id);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al publicar el precio' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/precios/${precioEditar._id}`,
        { preciocarga: precioEditar.preciocarga, tipocafe: precioEditar.tipocafe },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje({ tipo: 'exito', texto: '¡Precio actualizado exitosamente!' });
      setMostrarEditar(false);
      setPrecioEditar(null);
      obtenerPrecios(comprador._id);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el precio' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleEliminar = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/precios/${precioEliminar._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje({ tipo: 'exito', texto: 'Precio eliminado correctamente' });
      setMostrarEliminar(false);
      setPrecioEliminar(null);
      obtenerPrecios(comprador._id);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el precio' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleGuardarHorario = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/comprador/${comprador._id}`,
        horarioForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComprador({ ...comprador, ...horarioForm });
      setMensaje({ tipo: 'exito', texto: 'Horario actualizado correctamente' });
      setMostrarHorario(false);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el horario' });
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="bg-[#F5ECD7] px-8 py-6 flex items-center justify-between border-b border-[#E0D0B0]">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Panel del Comprador</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenido, <span className="text-[#C8A96E] font-semibold">{usuario?.nombre} {usuario?.apellido}</span>
            {comprador && <span className="text-gray-400"> · {comprador.nombreempresa}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMostrarHorario(true)}
            className="border border-[#C8A96E] text-[#C8A96E] px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#C8A96E] hover:text-white transition-colors flex items-center gap-2">
            <i className="fa-solid fa-clock"></i>
            {comprador ? `${comprador.horarioApertura || '08:00'} – ${comprador.horarioCierre || '17:00'}` : 'Horario'}
          </button>
          <button onClick={() => setMostrarFormulario(true)}
            className="bg-[#C8A96E] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-2">
            <i className="fa-solid fa-plus"></i>
            Publicar precio
          </button>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mx-8 mt-4 px-4 py-3 rounded-xl text-sm font-semibold ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* Stats */}
      <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-semibold">Precios publicados</p>
          <p className="text-[#2C1A0E] text-3xl font-bold mt-1">{precios.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-semibold">Último precio</p>
          <p className="text-[#C8A96E] text-3xl font-bold mt-1">
            {precios[0]?.preciocarga?.toLocaleString() || '---'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs uppercase font-semibold">Precio por kilo</p>
          <p className="text-[#2C1A0E] text-3xl font-bold mt-1">
            {precios[0]?.preciokg?.toLocaleString() || '---'}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="px-8 pb-8">
        <h2 className="text-[#2C1A0E] font-bold text-lg mb-4">Historial de precios</h2>
        <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-[#2C1A0E] rounded-xl text-xs text-gray-400 font-semibold uppercase mb-3">
          <div>Tipo de café</div>
          <div>Precio/carga</div>
          <div>Precio/kg</div>
          <div>Fecha</div>
          <div>Acciones</div>
        </div>
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : precios.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay precios publicados aún</div>
        ) : (
          precios.map((item, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-4 bg-white rounded-xl mb-3 items-center hover:shadow-md transition-shadow">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${item.tipocafe === 'especial' ? 'bg-purple-100 text-purple-700' :
                    item.tipocafe === 'organico' ? 'bg-green-100 text-green-700' :
                      item.tipocafe === 'verde' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'}`}>
                  {item.tipocafe?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="font-bold text-[#2C1A0E]">{item.preciocarga?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">COP/carga</p>
              </div>
              <div>
                <p className="font-semibold text-[#2C1A0E]">{item.preciokg?.toLocaleString()}</p>
                <p className="text-gray-400 text-xs">COP/kg</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">
                  {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPrecioEditar(item); setMostrarEditar(true); }}
                  className="bg-[#F5ECD7] text-[#2C1A0E] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E0D0B0] transition-colors">
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button onClick={() => { setPrecioEliminar(item); setMostrarEliminar(true); }}
                  className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal publicar precio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Publicar precio del día</h3>
              <button onClick={() => setMostrarFormulario(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handlePublicar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Precio por carga (COP)</label>
                <input type="number" placeholder="Ej: 1950000" required value={nuevoPrecio.preciocarga}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de café</label>
                <select value={nuevoPrecio.tipocafe}
                  onChange={(e) => setNuevoPrecio({ ...nuevoPrecio, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">Café especial</option>
                  <option value="organico">Orgánico</option>
                  <option value="verde">Verde</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarFormulario(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar precio */}
      {mostrarEditar && precioEditar && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Editar precio</h3>
              <button onClick={() => setMostrarEditar(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Precio por carga (COP)</label>
                <input type="number" required value={precioEditar.preciocarga}
                  onChange={(e) => setPrecioEditar({ ...precioEditar, preciocarga: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Tipo de café</label>
                <select value={precioEditar.tipocafe}
                  onChange={(e) => setPrecioEditar({ ...precioEditar, tipocafe: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]">
                  <option value="pergamino_seco">Pergamino seco</option>
                  <option value="especial">Café especial</option>
                  <option value="organico">Orgánico</option>
                  <option value="verde">Verde</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarEditar(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#C8A96E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#B8994E] transition-colors">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar precio */}
      {mostrarEliminar && precioEliminar && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-80 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-[#2C1A0E] font-bold text-lg mb-2">¿Eliminar precio?</h3>
            <p className="text-gray-400 text-sm mb-1">Vas a eliminar el precio de</p>
            <p className="text-[#2C1A0E] font-bold text-base mb-1">{precioEliminar.preciocarga?.toLocaleString()} COP/carga</p>
            <p className="text-gray-400 text-xs mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => { setMostrarEliminar(false); setPrecioEliminar(null); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal horario */}
      {mostrarHorario && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl p-8 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#2C1A0E] font-bold text-lg">Configurar horario</h3>
              <button onClick={() => setMostrarHorario(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleGuardarHorario}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora de apertura</label>
                <input type="time" value={horarioForm.horarioApertura}
                  onChange={e => setHorarioForm({ ...horarioForm, horarioApertura: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#2C1A0E] mb-2">Hora de cierre</label>
                <input type="time" value={horarioForm.horarioCierre}
                  onChange={e => setHorarioForm({ ...horarioForm, horarioCierre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C8A96E]" />
              </div>
              <p className="text-xs text-gray-400 mb-4 text-center">
                Horario actual: {horarioForm.horarioApertura} – {horarioForm.horarioCierre}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarHorario(false)}
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

    </div>
  );
}

export default DashboardComprador;
