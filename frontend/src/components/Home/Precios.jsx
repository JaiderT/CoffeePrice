import { useState, useEffect } from 'react';
import axios from 'axios';


function Precios() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [tendencia, setTendencia] = useState(null);

  useEffect(() => {
    const obtenerPrecios = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/precios`);
        setPrecios(data);
        if (data.length >=2 ) {
          const precios = data.map(p => p.preciocarga).sort((a, b) => b - a);
          const mejor = precios[0];
          const peor = precios[precios.length - 1];
          const diff = mejor - peor;
          const pct = peor > 0 ? ((diff / peor) * 100).toFixed(1) : 0;
          setTendencia({ pct, diff });
        }

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
    <div className="min-h-screen bg-[#F7F1E3]">

      {/* Header */}
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-5 border-b border-[#E7D9BF] bg-[linear-gradient(180deg,#F7EEDC_0%,#F7F1E3_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-[#2C1A0E] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5ECD7]">
              Precios del dia
            </span>

            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-[#2C1A0E]">
              Comparador de precios
            </h1>

            <p className="mt-2 text-sm md:text-base text-[#6B5A4D] leading-relaxed">
              Revisa rapidamente quien esta pagando mejor el cafè hoy en el Pital, Huila y compara
              los valores por carga de forma clara.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#2C1A0E] border border-[#E7D9BF]">
                Pital, Huila
              </span>
              <span className="rounded-full bg-[#E8F5EA] px-3 py-1.5 font-semibold text-[#2D6A4F]">
                ● {precios.length} compradores activos hoy
              </span>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-[#2C1A0E] px-5 py-3 text-sm font-bold text-[#F5ECD7] shadow-[0_10px_30px_rgba(44,26,14,0.18)] transition-all hover:bg-[#3D2415] hover:-translate-y-1px"
          >
            <i className="fa-solid fa-calculator"></i>
            Calcular ganancia
          </button>
        </div>
      </div>
      {/* Estadísticas */}
        <div className="px-5 md:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">
                  Precio promedio
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#F5ECD7] text-[#7A4020]">
                  <i className="fa-solid fa-chart-column"></i>
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#2C1A0E]">
                {precioPromedio.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#8B7355]">COP por carga de 125 kg</p>
            </div>

            <div className="rounded-2xl bg-[#2C1A0E] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#D8C7A8]">
                  Mejor pago
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#C8A96E] text-white">
                  <i className="fa-solid fa-trophy"></i>
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#F8F2E8]">
                {mejorPrecio.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#D8C7A8]">
                {precios[0]?.comprador?.nombreempresa || 'Sin registros aún'}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#E7D9BF] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">
                  Pago mas bajo
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FDEAEA] text-[#B42318]">
                  <i className="fa-solid fa-arrow-trend-down"></i>
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#B42318]">
                {precioMinimo.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#8B7355]">
                {precios[precios.length - 1]?.comprador?.nombreempresa || 'Sin registros aún'}
              </p>
            </div>

            <div className="rounded-2xl bg-[linear-gradient(135deg,#EFE3C8_0%,#E2C690_100%)] border border-[#D9BC81] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#6A4321]">
                  Diferencia entre precios
                </p>
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/70 text-[#7A4020]">
                  <i className="fa-solid fa-wave-square"></i>
                </span>
              </div>

              {tendencia ? (
                <>
                  <p className="mt-4 text-2xl font-bold text-[#2C1A0E]">
                    +{tendencia.pct}%
                  </p>
                  <p className="mt-1 text-xs text-[#6A4321]">
                    Hay una diferencia de ${tendencia.diff.toLocaleString()} entre el precio mas alto y el mas bajo.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-2xl font-bold text-[#2C1A0E]">--</p>
                  <p className="mt-1 text-xs text-[#6A4321]">
                    Aún no hay suficientes datos para calcular la brecha.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      {/* Filtros y búsqueda */}
      <div className="px-5 md:px-8 pb-5">
        <div className="rounded-2xl border border-[#E7D9BF] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355] text-sm"></i>
              <input
                type="text"
                placeholder="Buscar comprador..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-[#DCC9A6] bg-[#FCFAF6] py-2.5 pl-10 pr-4 text-sm text-[#2C1A0E] placeholder:text-[#9B8A7B] focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/30"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filtros.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    filtro === f
                      ? 'bg-[#2C1A0E] text-[#F5ECD7]'
                      : 'bg-[#F8F3EA] border border-[#E7D9BF] text-[#6B5A4D] hover:bg-[#EFE4CF]'
                  }`}
                >
                  {f === 'todos'
                    ? 'Todos'
                    : f === 'pergamino_seco'
                    ? 'Pergamino'
                    : f === 'especial'
                    ? 'Especial'
                    : f === 'organico'
                    ? 'Orgánico'
                    : 'Verde'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Listado de precios */}
      <div className="px-5 md:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[#2C1A0E] font-bold text-lg">Listado de compradores</h2>
            <p className="text-xs text-[#8B7355] mt-1">
              Organizados desde el valor mas alto hasta el mas bajo.
            </p>
          </div>
          <span className="hidden md:inline-flex rounded-full bg-white border border-[#E7D9BF] px-3 py-1.5 text-xs font-semibold text-[#6B5A4D]">
            {preciosFiltrados.length} resultados
          </span>
        </div>
        <div className="mb-4 rounded-2xl border border-[#E7D9BF] bg-[#FFF9ED] px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3E2B8] text-[#7A4020] text-sm">
              <i className="fa-solid fa-circle-info"></i>
            </span>
            <div>
              <p className="text-sm font-bold text-[#2C1A0E]">Ten presente</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B5A4D]">
                Los precios pueden cambiar en cualquier momento. Antes de llevar tu café,
                confirma el valor con el comprador.
              </p>
            </div>
          </div>
        </div>


        {cargando ? (
          <div className="rounded-2xl bg-white border border-[#E7D9BF] py-12 text-center text-sm text-[#8B7355]">
            Cargando precios...
          </div>
        ) : preciosFiltrados.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7D9BF] py-12 text-center">
            <p className="text-sm font-semibold text-[#2C1A0E]">No se encontraron compradores</p>
            <p className="mt-1 text-xs text-[#8B7355]">
              Prueba con otro nombre o cambia el tipo de café.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {preciosFiltrados.map((item, i) => {
              const porcentaje = mejorPrecio ? Math.round((item.preciocarga / mejorPrecio) * 100) : 0;
              const medallas = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={i}
                  className="rounded-2xl border border-[#E7D9BF] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5ECD7] text-sm font-bold text-[#7A4020]">
                        {i < 3 ? medallas[i] : i + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm md:text-base font-bold text-[#2C1A0E]">
                            {item.comprador?.nombreempresa || 'Sin nombre'}
                          </p>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              item.tipocafe === 'especial'
                                ? 'bg-[#F3E8FF] text-[#7E22CE]'
                                : item.tipocafe === 'organico'
                                ? 'bg-[#E8F5EA] text-[#2D6A4F]'
                                : item.tipocafe === 'verde'
                                ? 'bg-[#E6F6F0] text-[#147D64]'
                                : 'bg-[#FFF4D6] text-[#9A6700]'
                            }`}
                          >
                            {item.tipocafe === 'pergamino_seco'
                              ? 'Pergamino'
                              : item.tipocafe === 'especial'
                              ? 'Especial'
                              : item.tipocafe === 'organico'
                              ? 'Orgánico'
                              : 'Verde'}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#8B7355]">
                          {item.comprador?.direccion || 'Dirección no disponible'}
                        </p>

                        <p className="mt-2 text-xs text-[#8B7355]">
                          Actualizado el{' '}
                          {new Date(item.updatedAt).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:gap-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">
                          Precio por carga
                        </p>
                        <p className="mt-1 text-xl font-bold text-[#2C1A0E]">
                          {item.preciocarga?.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#8B7355]">COP</p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-[#8B7355]">
                          Precio por kilo
                        </p>
                        <p className="mt-1 text-base font-semibold text-[#2C1A0E]">
                          {item.preciokg?.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#8B7355]">COP/kg</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#8B7355]">
                      <span>Frente al mejor valor del dia</span>
                      <span>{porcentaje}%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#F1E7D3] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#B8894F]"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Precios;
