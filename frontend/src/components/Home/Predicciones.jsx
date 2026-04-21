import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RANGOS = [7, 15, 30];

const tendenciaConfig = {
  sube: {
    etiqueta: 'Tendencia al alza',
    color: 'text-green-700',
    fondo: 'bg-green-50 border-green-200',
    icono: '↗',
  },
  baja: {
    etiqueta: 'Tendencia a la baja',
    color: 'text-red-700',
    fondo: 'bg-red-50 border-red-200',
    icono: '↘',
  },
  estable: {
    etiqueta: 'Tendencia estable',
    color: 'text-amber-700',
    fondo: 'bg-amber-50 border-amber-200',
    icono: '→',
  },
};

export default function Predicciones() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [rangoSeleccionado, setRangoSeleccionado] = useState(7);
  const [resumen, setResumen] = useState(null);
  const [predicciones, setPredicciones] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  useEffect(() => {
    const obtenerResumen = async () => {
      setCargandoResumen(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/predicciones/resumen`);
        setResumen(data);
      } catch (error) {
        if (error.response?.status === 404) {
          setResumen(null);
        } else {
          console.error('Error al obtener resumen de predicciones:', error);
        }
      } finally {
        setCargandoResumen(false);
      }
    };

    obtenerResumen();
  }, [API_URL]);

  const ejecutarConsulta = async (dias = rangoSeleccionado) => {
    setCargandoConsulta(true);
    setConsultaRealizada(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/predicciones/rango?dias=${dias}`);
      setPredicciones(data.predicciones || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setPredicciones([]);
      } else {
        console.error('Error al obtener predicciones por rango:', error);
      }
    } finally {
      setCargandoConsulta(false);
    }
  };

  const normalizarFecha = (fecha) => {
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Date(`${fecha}T12:00:00`);
    }
    return new Date(fecha);
  };

  const formatearFecha = (fecha, largo = false) =>
    normalizarFecha(fecha).toLocaleDateString('es-CO', largo
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { day: '2-digit', month: 'short' });

  const configResumen = tendenciaConfig[resumen?.tendencia] || tendenciaConfig.estable;

  const datosGrafica = predicciones.map((item) => ({
    fecha: formatearFecha(item.fecha),
    precio: item.precioestimado,
    minimo: item.preciominimo,
    maximo: item.preciomaximo,
  }));

  const promedio =
    predicciones.length > 0
      ? Math.round(predicciones.reduce((acc, item) => acc + item.precioestimado, 0) / predicciones.length)
      : 0;

  const maximo =
    predicciones.length > 0
      ? Math.max(...predicciones.map((item) => item.preciomaximo))
      : 0;

  const minimo =
    predicciones.length > 0
      ? Math.min(...predicciones.map((item) => item.preciominimo))
      : 0;

  const confianzaPromedio =
    predicciones.length > 0
      ? Math.round(predicciones.reduce((acc, item) => acc + item.confianza, 0) / predicciones.length)
      : 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F2E7D7_0%,#EADBC5_55%,#F6EFE5_100%)] text-[#2F241C]">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section className="overflow-hidden rounded-4xl bg-[linear-gradient(135deg,#2F241C_0%,#4A3426_55%,#6C4B34_100%)] px-6 py-8 text-[#F9F3EA] shadow-[0_24px_70px_rgba(47,36,28,0.28)] md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8D8C1]">
                Predicciones de precio
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Consulta el comportamiento esperado del precio sin perder de vista el historial
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E6D7C2] md:text-base">
                Busca el rango que quieres revisar y analiza el estimado, la confianza y la variación proyectada.
              </p>
            </div>

            <Link
              to="/precios"
              className="inline-flex items-center justify-center rounded-2xl bg-[#F3E5CE] px-5 py-3 text-sm font-bold text-[#2F241C] shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-[#F7EBD8]"
            >
              Volver a precios
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] bg-[#F8F1E6] p-5 shadow-[0_12px_30px_rgba(96,73,47,0.10)] ring-1 ring-[#E8D8BF]/80">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
              Resumen principal
            </p>

            {cargandoResumen ? (
              <p className="mt-3 text-sm text-[#6D5E53]">Cargando predicción...</p>
            ) : resumen ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="rounded-2xl bg-[#F3E5D3] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">
                      Precio estimado
                    </p>
                    <p className="mt-1 text-3xl font-black text-[#2F241C]">
                      ${resumen.precioestimado.toLocaleString()}
                    </p>
                  </div>

                  <div className={`rounded-2xl border px-4 py-3 ${configResumen.fondo}`}>
                    <p className={`text-sm font-bold ${configResumen.color}`}>
                      {configResumen.icono} {configResumen.etiqueta}
                    </p>
                    <p className="mt-1 text-xs text-[#6D5E53]">
                      Confianza: {resumen.confianza}%
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold text-[#5F452C]">
                  Para el {formatearFecha(resumen.fecha, true)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#6D5E53]">
                  {resumen.mensaje}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#6D5E53]">No hay predicción disponible por ahora.</p>
            )}
          </article>

          <article className="rounded-[28px] bg-[linear-gradient(135deg,#E7D0A7_0%,#F3E5CB_100%)] p-5 shadow-[0_12px_30px_rgba(145,100,48,0.12)] ring-1 ring-[#DFC18E]/70">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">
              Buscar historial
            </p>
            <p className="mt-3 text-sm text-[#6A543F]">
              Elige un horizonte y consulta el comportamiento proyectado. El historial solo aparece cuando lo buscas.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {RANGOS.map((dias) => (
                <button
                  key={dias}
                  onClick={() => setRangoSeleccionado(dias)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    rangoSeleccionado === dias
                      ? 'bg-[#2F241C] text-[#F9F3EA] shadow-[0_6px_18px_rgba(47,36,28,0.18)]'
                      : 'bg-[#F5EBDD] text-[#6B5A4D] hover:bg-[#F0E2D0]'
                  }`}
                >
                  {dias} días
                </button>
              ))}
            </div>

            <button
              onClick={() => ejecutarConsulta(rangoSeleccionado)}
              disabled={cargandoConsulta}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-5 py-3 text-sm font-bold text-[#F7F1E8] transition hover:bg-[#443126] disabled:opacity-60"
            >
              {cargandoConsulta ? 'Consultando...' : `Buscar historial de ${rangoSeleccionado} días`}
            </button>
          </article>
        </section>

        {consultaRealizada && (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl bg-[#F8F1E6] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#E8D8BF]/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">Promedio</p>
                <p className="mt-2 text-2xl font-black text-[#2F241C]">${promedio.toLocaleString()}</p>
              </article>
              <article className="rounded-3xl bg-[#F8F1E6] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#E8D8BF]/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">Pico esperado</p>
                <p className="mt-2 text-2xl font-black text-[#2F241C]">${maximo.toLocaleString()}</p>
              </article>
              <article className="rounded-3xl bg-[#F8F1E6] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#E8D8BF]/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">Piso esperado</p>
                <p className="mt-2 text-2xl font-black text-[#2F241C]">${minimo.toLocaleString()}</p>
              </article>
              <article className="rounded-3xl bg-[#F8F1E6] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#E8D8BF]/80">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">Confianza media</p>
                <p className="mt-2 text-2xl font-black text-[#2F241C]">{confianzaPromedio}%</p>
              </article>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-[28px] bg-[#F8F1E6] p-5 shadow-[0_12px_30px_rgba(96,73,47,0.10)] ring-1 ring-[#E8D8BF]/80">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
                      Comportamiento proyectado
                    </p>
                    <p className="mt-1 text-sm text-[#6D5E53]">
                      Visualiza cómo se movería el precio estimado dentro del rango consultado.
                    </p>
                  </div>
                </div>

                {cargandoConsulta ? (
                  <div className="mt-6 h-70 rounded-3xl bg-[#F5EBDD] animate-pulse" />
                ) : predicciones.length === 0 ? (
                  <p className="mt-6 text-sm text-[#6D5E53]">No encontramos predicciones para ese rango.</p>
                ) : (
                  <div className="mt-6 h-70">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={datosGrafica}>
                        <defs>
                          <linearGradient id="precioEstimado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8A5A2B" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#8A5A2B" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E3D0B8" strokeDasharray="4 4" />
                        <XAxis dataKey="fecha" tick={{ fill: '#8A735B', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#8A735B', fontSize: 12 }} width={86} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 18,
                            border: '1px solid #E3D0B8',
                            background: '#FFF9F1',
                          }}
                          formatter={(valor) => `$${Number(valor).toLocaleString()}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="precio"
                          stroke="#8A5A2B"
                          strokeWidth={3}
                          fill="url(#precioEstimado)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="rounded-[28px] bg-[linear-gradient(135deg,#E7D0A7_0%,#F3E5CB_100%)] p-5 shadow-[0_12px_30px_rgba(145,100,48,0.12)] ring-1 ring-[#DFC18E]/70">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">
                  Estadística rápida
                </p>

                {predicciones.length === 0 ? (
                  <p className="mt-3 text-sm text-[#6A543F]">Haz una búsqueda para ver estadísticas del rango.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/65 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Días consultados</p>
                      <p className="mt-1 text-xl font-black text-[#2F241C]">{predicciones.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white/65 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Variación estimada</p>
                      <p className="mt-1 text-xl font-black text-[#2F241C]">
                        ${(maximo - minimo).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/65 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Lectura</p>
                      <p className="mt-1 text-sm text-[#6A543F]">
                        {maximo - minimo > 60000
                          ? 'Se espera un rango amplio, así que conviene seguir el mercado de cerca.'
                          : 'El comportamiento esperado luce relativamente controlado para este periodo.'}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            </section>

            <section className="mt-7">
              <div className="mb-4">
                <h2 className="text-2xl font-black text-[#2F241C]">Historial consultado</h2>
                <p className="text-sm text-[#705F51]">
                  Revisa el valor proyectado, la tendencia y el rango esperado para cada fecha.
                </p>
              </div>

              {cargandoConsulta ? (
                <div className="rounded-[28px] bg-[#F9F4EC] py-12 text-center text-sm text-[#7B6A5C] shadow-[0_10px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E8D8C2]">
                  Cargando predicciones...
                </div>
              ) : predicciones.length === 0 ? (
                <div className="rounded-[28px] bg-[#F9F4EC] py-12 text-center shadow-[0_10px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E8D8C2]">
                  <p className="font-semibold text-[#2F241C]">No hay predicciones disponibles para este rango</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {predicciones.map((item) => {
                    const config = tendenciaConfig[item.tendencia] || tendenciaConfig.estable;
                    return (
                      <article
                        key={item._id || item.fecha}
                        className="rounded-[28px] bg-[linear-gradient(180deg,#FBF6EE_0%,#F7EFE3_100%)] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.07)] ring-1 ring-[#E7D6BF]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
                              {formatearFecha(item.fecha, true)}
                            </p>
                            <p className="mt-2 text-2xl font-black text-[#2F241C]">
                              ${item.precioestimado.toLocaleString()}
                            </p>
                          </div>

                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${config.fondo} ${config.color}`}>
                            {config.icono} {config.etiqueta}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-[#F3E5D3] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Mínimo</p>
                            <p className="mt-1 text-lg font-black text-[#2F241C]">
                              ${item.preciominimo.toLocaleString()}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#EFE4D4] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Máximo</p>
                            <p className="mt-1 text-lg font-black text-[#2F241C]">
                              ${item.preciomaximo.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-[#6D5E53]">
                          Confianza del modelo: <span className="font-semibold text-[#5F452C]">{item.confianza}%</span>
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
