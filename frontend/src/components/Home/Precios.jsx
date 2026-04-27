import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import MapaCompradores from "./MapaCompradores.jsx";

const esPorKg = (tipo) => ['pasilla', 'cacao', 'limon'].includes(tipo);

const LABEL_TIPO = {
  pergamino_seco: '☕ Pergamino seco',
  verde: '🌿 Café verde / mojado',
  especial: '✨ Café especial',
  organico: '🌱 Café orgánico',
  pasilla: '🟤 Pasilla',
  cacao: '🍫 Cacao',
  limon: '🍋 Limón',
};

function Precios() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { usuario } = useAuth();

  const [precios, setPrecios] = useState([]);
  const [clima, setClima] = useState(null);
  const [prediccion, setPrediccion] = useState(null);
  const [precioFNC, setPrecioFNC] = useState(null);
  const [fuenteFNC, setFuenteFNC] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [cargandoClima, setCargandoClima] = useState(true);
  const [cargandoPrediccion, setCargandoPrediccion] = useState(true);

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

    const obtenerClima = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/clima`);
        setClima(data);
      } catch (error) {
        console.error('Error al obtener clima:', error);
      } finally {
        setCargandoClima(false);
      }
    };

    const obtenerPrediccion = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/predicciones/resumen`);
        setPrediccion(data);
      } catch (error) {
        if (error.response?.status === 404) {
          setPrediccion(null);
        } else {
          console.error('Error al obtener predicción:', error);
        }
      } finally {
        setCargandoPrediccion(false);
      }
    };

    const obtenerPrecioFNC = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/precio-fnc`);
        if (data?.precio) {
          setPrecioFNC(data.precio);
          setFuenteFNC(data.fuente);
        }
      } catch (error) {
        console.error('Error al obtener precio FNC:', error);
      }
    };

    obtenerPrecios();
    obtenerClima();
    obtenerPrediccion();
    obtenerPrecioFNC();
  }, [API_URL]);

  const filtros = ['todos', 'pergamino_seco', 'verde', 'especial', 'organico', 'pasilla', 'cacao', 'limon'];

  const preciosFiltrados = precios
    .filter((p) => filtro === 'todos' || p.tipocafe === filtro)
    .filter((p) =>
      p.comprador?.nombreempresa?.toLowerCase().includes(busqueda.toLowerCase())
    );

  const preciosVisibles = usuario ? preciosFiltrados : preciosFiltrados.slice(0, 3);

  const mejorPrecio = precios[0]?.preciocarga || 0;
  const mejorComprador = precios[0]?.comprador?.nombreempresa || 'Sin registros';

  const compradoresUnicos = new Set(precios.map(p => p.comprador?._id).filter(Boolean)).size;

  const diferencia =
    precios.length > 1
      ? precios[0].preciocarga - precios[precios.length - 1].preciocarga
      : 0;

  const obtenerRecomendacionClima = () => {
    if (!clima?.actual) return 'Consulta el clima antes de mover o secar café.';
    if (clima.actual.resumen) return clima.actual.resumen;

    const { lluvia, humedad, descripcion, viento } = clima.actual;

    if (lluvia >= 5) return 'Se esperan lluvias fuertes. Protege el café.';
    if (lluvia > 0 || descripcion?.toLowerCase().includes('lluvia')) {
      return 'Puede llover durante la jornada. Mantén el café cubierto.';
    }
    if (humedad >= 80) return 'La humedad está alta. Ten cuidado con el secado.';
    if (viento >= 20) return 'Hay bastante viento. Revisa lonas y cubiertas.';

    return 'El clima se ve estable para la jornada.';
  };

  const normalizarFecha = (fecha) => {
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Date(`${fecha}T12:00:00`);
    }
    return new Date(fecha);
  };

  const formatearDiaCorto = (fecha) =>
    normalizarFecha(fecha).toLocaleDateString('es-CO', { weekday: 'short' });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F2E7D7_0%,#EADBC5_55%,#F6EFE5_100%)] text-[rgb(47,36,28)]">
      <div className={`mx-auto max-w-7xl px-5 md:px-8 ${usuario ? 'py-8' : 'py-6 md:py-8'}`}>
        <section className="overflow-hidden rounded-4xl bg-[linear-gradient(135deg,#2F241C_0%,#4A3426_55%,#6C4B34_100%)] px-6 py-8 text-[#F9F3EA] shadow-[0_24px_70px_rgba(47,36,28,0.28)] md:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8D8C1]">
                Pital, Huila
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Revisa cuánto están pagando hoy por tu café
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E6D7C2] md:text-base">
                Compara los precios publicados por los compradores de la zona y mira si mañana podría subir, bajar o seguir parecido.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#D7C2A7]">
                    Mejor pago hoy
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    ${mejorPrecio.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#DDBA83] px-4 py-3 text-[#2F241C]">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#6A4321]">
                    Compradores registrados
                  </p>
                  <p className="mt-1 text-2xl font-black">{compradoresUnicos}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-kaffi="precios-resumen" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr]">
          <article className="group relative overflow-hidden rounded-[28px] bg-[#F8F1E6] p-5 shadow-[0_12px_30px_rgba(96,73,47,0.10)] ring-1 ring-[#E8D8BF]/80 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(96,73,47,0.14)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
              Precio FNC hoy
            </p>
            <p className="mt-3 text-3xl font-black text-[#2F241C]">
              {precioFNC ? `$${precioFNC.toLocaleString()}` : '···'}
            </p>
            <p className="mt-3 text-sm font-semibold text-[#5F452C]">
              Precio de referencia FNC.
            </p>
            <p className="mt-1 text-sm text-[#6D5E53]">
              {fuenteFNC === 'fnc-directo'
                ? 'Dato tomado directamente de la FNC.'
                : fuenteFNC === 'ny-estimado'
                ? 'Estimado a partir del precio en bolsa de NY.'
                : 'Actualizando precio...'}
            </p>
          </article>

          <article className="group relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#2F241C_0%,#3B2C22_100%)] p-5 text-[#F8F2E8] shadow-[0_14px_34px_rgba(47,36,28,0.22)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(47,36,28,0.28)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4C2A5]">
              El mejor pago de hoy en nuestra plataforma
            </p>
            <p className="mt-3 text-3xl font-black">
              ${mejorPrecio.toLocaleString()}
            </p>
            <p className="mt-3 text-sm font-semibold text-[#F1E3D0]">
              {mejorComprador}
            </p>
            <p className="mt-1 text-sm text-[#D9C9AF]">
              En este momento es el comprador que mejor está pagando.
            </p>
          </article>

          <article className="rounded-[28px] bg-[linear-gradient(135deg,#E7D0A7_0%,#F3E5CB_100%)] p-5 shadow-[0_12px_30px_rgba(145,100,48,0.12)] ring-1 ring-[#DFC18E]/70 md:col-span-2 xl:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">
              Precio esperado para mañana
            </p>
            {cargandoPrediccion ? (
              <p className="mt-3 text-sm text-[#6A543F]">Cargando predicción...</p>
            ) : prediccion ? (
              <>
                <p className="mt-3 text-3xl font-black text-[#2F241C]">
                  ${prediccion.precioestimado.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-[#6A543F]">
                  Para el{' '}
                  {normalizarFecha(prediccion.fecha).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#5F452C]">
                  {prediccion.tendencia === 'sube'
                    ? 'Mañana podría pagar mejor'
                    : prediccion.tendencia === 'baja'
                    ? 'Mañana podría bajar un poco'
                    : 'Mañana seguiría parecido a hoy'}
                </p>
                <p className="mt-1 text-sm text-[#6A543F]">
                  Seguridad del pronóstico: {prediccion.confianza}%
                </p>
                <Link
                  to="/predicciones"
                  className="mt-4 inline-flex items-center rounded-full bg-[#2F241C] px-4 py-2 text-xs font-bold text-[#F7F1E8] transition hover:bg-[#443126]"
                >
                  Ver predicciones completas
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#6A543F]">
                No hay predicción disponible.
              </p>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,#EAD9C2_0%,#E5D2BA_100%)] p-4 shadow-[0_12px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#DEC7A7]/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full xl:max-w-md">
              <input
                data-kaffi="precios-busqueda"
                type="text"
                placeholder="Busca por nombre del comprador"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-2xl border border-[#D7C0A1] bg-[#F9F4EC] px-4 py-3 text-sm text-[#2F241C] outline-none placeholder:text-[#9B8775] focus:border-[#B78E59]"
              />
            </div>

            <div data-kaffi="precios-filtros" className="flex flex-wrap gap-2 pt-1">
              {filtros.map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filtro === f
                      ? 'bg-[#2F241C] text-[#F9F3EA] shadow-[0_6px_18px_rgba(47,36,28,0.18)]'
                      : 'bg-[#F5EBDD] text-[#6B5A4D] hover:bg-[#F0E2D0]'
                  }`}
                >
                  {f === 'todos' ? 'Ver todos'
                    : f === 'pergamino_seco' ? '☕ Pergamino seco'
                    : f === 'verde' ? '🌿 Café verde'
                    : f === 'especial' ? '✨ Especial'
                    : f === 'organico' ? '🌱 Orgánico'
                    : f === 'pasilla' ? '🟤 Pasilla'
                    : f === 'cacao' ? '🍫 Cacao'
                    : '🍋 Limón'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#2F241C]">Compradores de hoy</h2>
              <p className="text-sm text-[#705F51]">
                Revisa quién está pagando mejor hoy y compáralo antes de tomar una decisión.
              </p>
            </div>
            <span className="self-start rounded-full bg-[#F7EFE4] px-3 py-1 text-xs font-semibold text-[#6B5A4D] ring-1 ring-[#E3D0B8]">
              {usuario
                ? `${preciosFiltrados.length} resultados`
                : `Mostrando ${preciosVisibles.length} de ${preciosFiltrados.length}`}
            </span>
          </div>

          {cargando ? (
            <div className="rounded-[28px] bg-[#F9F4EC] py-12 text-center text-sm text-[#7B6A5C] shadow-[0_10px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E8D8C2]">
              Cargando precios...
            </div>
          ) : preciosFiltrados.length === 0 ? (
            <div className="rounded-[28px] bg-[#F9F4EC] py-12 text-center shadow-[0_10px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E8D8C2]">
              <p className="font-semibold text-[#2F241C]">
                No encontramos compradores con ese filtro
              </p>
              <p className="mt-1 text-sm text-[#7B6A5C]">
                Prueba con otro nombre o cambia el tipo de producto.
              </p>
            </div>
          ) : (
            <div data-kaffi="precios-lista" className="space-y-3">
              {preciosVisibles.map((item, i) => {
                const porKg = esPorKg(item.tipocafe);
                return (
                  <article
                    key={i}
                    className="rounded-[28px] bg-[linear-gradient(180deg,#FBF6EE_0%,#F7EFE3_100%)] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.07)] ring-1 ring-[#E7D6BF] transition hover:bg-[linear-gradient(180deg,#FCF7F0_0%,#F3E7D8_100%)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-[#2F241C]">
                            {item.comprador?.nombreempresa || 'Sin nombre'}
                          </h3>
                          <span className="rounded-full bg-[#E8D8C1] px-3 py-1 text-xs font-semibold text-[#5D4A3D]">
                            {LABEL_TIPO[item.tipocafe] || item.tipocafe?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#746456]">
                          {item.comprador?.direccion || 'Dirección no disponible'}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#5F452C]">
                          Actualizó su precio el{' '}
                          {new Date(item.updatedAt).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 xl:gap-6">
                        <div className="min-w-37.5 rounded-2xl bg-[#F3E5D3] px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">
                            {porKg ? 'Paga por kg' : 'Paga por carga'}
                          </p>
                          <p className="mt-1 text-2xl font-black text-[#2F241C]">
                            ${item.preciocarga?.toLocaleString()}
                          </p>
                        </div>

                        {!porKg && (
                          <div className="min-w-37.5 rounded-2xl bg-[#EFE4D4] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">
                              Paga por kilo
                            </p>
                            {usuario ? (
                              <p className="mt-1 text-lg font-bold text-[#2F241C]">
                                ${item.preciokg?.toLocaleString()}
                              </p>
                            ) : (
                              <Link
                                to="/login"
                                className="mt-1 inline-block text-sm font-semibold text-[#8A5A2B]"
                              >
                                Disponible al iniciar sesión
                              </Link>
                            )}
                          </div>
                        )}

                        {usuario && (
                          <Link
                            to={`/comprador/${item.comprador?._id}`}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#2F241C] px-4 py-3 text-sm font-semibold text-[#F7F1E8] transition hover:bg-[#443126] md:w-auto"
                          >
                            Ver detalles
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {!usuario && preciosFiltrados.length > 3 && (
                <div className="rounded-[28px] bg-[linear-gradient(135deg,#2F241C_0%,#4A3426_100%)] p-6 text-[#F8F2E8] shadow-[0_16px_36px_rgba(47,36,28,0.18)]">
                  <p className="text-sm font-semibold text-[#DCC9AF]">
                    Estás viendo una muestra del mercado
                  </p>
                  <h3 className="mt-2 text-2xl font-black">
                    Inicia sesión para ver todos los compradores
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#E8DCCB]">
                    También podrás consultar el precio por kilo y ver más detalles de cada comprador antes de vender.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#F3E5CE] px-4 py-3 text-sm font-semibold text-[#2F241C] transition hover:bg-[#F7EBD8]"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center rounded-2xl border border-[#CDB79A] px-4 py-3 text-sm font-semibold text-[#F8F2E8] transition hover:bg-white/5"
                    >
                      Crear cuenta
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] bg-[linear-gradient(135deg,#F7EFE4_0%,#EEDFCA_100%)] p-5 shadow-[0_10px_24px_rgba(96,73,47,0.08)] ring-1 ring-[#E3D0B8]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
              Cómo está el clima hoy
            </p>
            {cargandoClima ? (
              <p className="mt-3 text-sm text-[#6D5E53]">Cargando clima...</p>
            ) : clima?.actual ? (
              <>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-3xl shadow-inner">
                    {clima.actual.icono || '🌤️'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#2F241C]">
                      {clima.actual.descripcion}
                    </p>
                    <p className="mt-1 text-sm text-[#6D5E53]">
                      {Math.round(clima.actual.temperatura)}°C en este momento
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#6D5E53]">{obtenerRecomendacionClima()}</p>
                {clima.pronostico?.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    {clima.pronostico.slice(0, 4).map((dia) => (
                      <div
                        key={dia.fecha}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F9F2E8] text-lg ring-1 ring-[#E3D0B8]"
                        title={`${formatearDiaCorto(dia.fecha)} - ${dia.descripcion}`}
                      >
                        {dia.icono || '🌤️'}
                      </div>
                    ))}
                    <span className="ml-1 text-[11px] text-[#8A735B]">Próximos días</span>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-[#6D5E53]">Sin datos de clima por ahora.</p>
            )}
          </article>

          <article className="rounded-[28px] bg-[linear-gradient(135deg,#D9E0C8_0%,#EEF1E3_100%)] p-5 shadow-[0_10px_24px_rgba(80,95,52,0.10)] ring-1 ring-[#CBD3B8]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#66714C]">
              Antes de vender
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#556041]">
              Los precios pueden cambiar durante el día. Antes de llevar tu café,
              confirma el valor directamente con el comprador.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}

export default Precios;
