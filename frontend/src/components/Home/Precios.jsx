import { useState, useEffect } from 'react';
import axios from 'axios';


function Precios() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const obtenerPrecios = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/precios`);
        setPrecios(data);
      } catch (error) {
        console.error('Error al obtener precios:', error);
      } finally {
        setCargando(false);
      }
    };
    obtenerPrecios();
  }, []);

  const filtros = ['todos', 'pergamino_seco', 'especial', 'organico', 'verde'];

  const preciosFiltrados = precios
    .filter(p => filtro === 'todos' || p.tipocafe === filtro)
    .filter(p => p.comprador?.nombreempresa?.toLowerCase().includes(busqueda.toLowerCase()));

  const mejorPrecio = precios[0]?.preciocarga || 0;
  const precioPromedio = precios.length > 0
    ? Math.round(precios.reduce((acc, p) => acc + p.preciocarga, 0) / precios.length)
    : 0;
  const precioMinimo = precios.length > 0
    ? Math.min(...precios.map(p => p.preciocarga))
    : 0;

  return (
    <div className="min-h-screen bg-[#F5ECD7]">

      {/* Header */}
      <div className="bg-[#F5ECD7] px-8 py-6 flex items-center justify-between border-b border-[#E0D0B0]">
        <div>
          <h1 className="text-[#2C1A0E] text-2xl font-bold">Comparador de Precios</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pital, Huila ·
            <span className="text-green-500 ml-1">● {precios.length} compradores activos hoy</span>
          </p>
        </div>
        <button
          className="bg-[#C8A96E] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors flex items-center gap-2">
           <i class="fa-solid fa-calculator"></i> Calcular ganancia 
        </button>
      </div>

      {/* Barra de estadísticas */}
      <div className="bg-[#2C1A0E] px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border-r border-gray-700 pr-6">
          <p className="text-gray-400 text-xs uppercase">Precio promedio hoy</p>
          <p className="text-white text-2xl font-bold mt-1">{precioPromedio.toLocaleString()} <span className="text-sm font-normal text-gray-400">COP</span></p>
          <p className="text-gray-400 text-xs mt-1">por carga (125 kg)</p>
        </div>
        <div className="border-r border-gray-700 pr-6">
          <p className="text-gray-400 text-xs uppercase">🏆 Mejor precio</p>
          <p className="text-[#C8A96E] text-2xl font-bold mt-1">{mejorPrecio.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">{precios[0]?.comprador?.nombreempresa || '---'}</p>
        </div>
        <div className="border-r border-gray-700 pr-6">
          <p className="text-gray-400 text-xs uppercase">📉 Precio mínimo</p>
          <p className="text-red-400 text-2xl font-bold mt-1">{precioMinimo.toLocaleString()}</p>
          <p className="text-gray-400 text-xs mt-1">{precios[precios.length - 1]?.comprador?.nombreempresa || '---'}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase">📈 Tendencia</p>
          <p className="text-green-400 text-2xl font-bold mt-1">▲ +2.1%</p>
          <p className="text-gray-400 text-xs mt-1">vs ayer · +$41.000</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="px-8 py-4 flex flex-col md:flex-row items-center gap-4 border-b border-[#E0D0B0]">
        <input
          type="text"
          placeholder="🔍 Buscar comprador por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-full px-4 py-2 text-sm w-full md:w-72 focus:outline-none focus:border-[#C8A96E]"
        />
        <div className="flex gap-2 flex-wrap">
          {filtros.map((f, i) => (
            <button
              key={i}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${filtro === f
                  ? 'bg-[#C8A96E] text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-[#C8A96E]'
                }`}
            >
              {f === 'todos' ? 'Todos' :
                f === 'pergamino_seco' ? 'Pergamino seco' :
                  f === 'especial' ? 'Café especial' :
                    f === 'organico' ? 'Orgánico' : 'Verde'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de precios */}
      <div className="px-8 py-6">

        {/* Encabezado tabla */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-[#2C1A0E] rounded-xl text-xs text-gray-400 font-semibold uppercase mb-3">
          <div>#</div>
          <div className="col-span-2">Comprador</div>
          <div>Precio/carga</div>
          <div>COP/kg</div>
          <div>Actualizado</div>
        </div>

        {/* Filas */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando precios...</div>
        ) : preciosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No se encontraron compradores</div>
        ) : (
          preciosFiltrados.map((item, i) => {
            const porcentaje = Math.round((item.preciocarga / mejorPrecio) * 100);
            const medallas = ['🥇', '🥈', '🥉'];

            return (
              <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4 bg-white rounded-xl mb-3 items-center hover:shadow-md transition-shadow">

                {/* Posición */}
                <div className="text-lg">
                  {i < 3 ? medallas[i] : <span className="text-gray-400 font-semibold text-sm">{i + 1}</span>}
                </div>

                {/* Comprador */}
                <div className="col-span-2">
                  <p className="font-semibold text-[#2C1A0E] text-sm">{item.comprador?.nombreempresa || 'Sin nombre'}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.comprador?.direccion || '---'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                    ${item.tipocafe === 'especial' ? 'bg-purple-100 text-purple-700' :
                      item.tipocafe === 'organico' ? 'bg-green-100 text-green-700' :
                        item.tipocafe === 'verde' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'}`}>
                    {item.tipocafe?.replace('_', ' ')}
                  </span>
                </div>

                {/* Precio carga */}
                <div>
                  <p className="font-bold text-[#2C1A0E] text-base">{item.preciocarga?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">COP / carga</p>
                  <div className="mt-1 bg-gray-100 rounded-full h-1.5 w-full">
                    <div className="bg-[#C8A96E] h-1.5 rounded-full" style={{ width: `${porcentaje}%` }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{porcentaje}%</p>
                </div>

                {/* Precio kg */}
                <div>
                  <p className="font-semibold text-[#2C1A0E] text-sm">{item.preciokg?.toLocaleString()}</p>
                </div>

                {/* Actualizado */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">
                    {new Date(item.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                  <button className="bg-[#C8A96E] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#B8994E] transition-colors">
                    Ver
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  )
}

export default Precios;
