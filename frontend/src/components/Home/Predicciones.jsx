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
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';

const RANGOS = [7, 15, 30];

const tendenciaConfig = {
  sube: {
    etiqueta: 'Puede subir',
    icono: ArrowUpRight,
    color: 'text-[#256D3D]',
    fondo: 'bg-[#E8F6EC] border-[#B9DFC5]',
    tono: 'from-[#F4FBF5] via-[#EEF8F1] to-[#E0F0E5]',
    acento: '#256D3D',
  },
  baja: {
    etiqueta: 'Puede bajar',
    icono: ArrowDownRight,
    color: 'text-[#A04A2B]',
    fondo: 'bg-[#FDEDE4] border-[#EABFA7]',
    tono: 'from-[#FFF7F2] via-[#FCEFE7] to-[#F8E2D6]',
    acento: '#A04A2B',
  },
  estable: {
    etiqueta: 'Puede seguir parecido',
    icono: ArrowRight,
    color: 'text-[#8C6A20]',
    fondo: 'bg-[#FBF3DE] border-[#E7D49D]',
    tono: 'from-[#FFFBEF] via-[#FBF6E7] to-[#F5ECD1]',
    acento: '#8C6A20',
  },
};

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

const formatSignedCurrency = (value) => {
  const numero = Number(value || 0);
  return `${numero >= 0 ? '+' : '-'}${formatCurrency(Math.abs(numero))}`;
};

const normalizarFecha = (fecha) => {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return new Date(`${fecha}T12:00:00`);
  }
  return new Date(fecha);
};

const formatearFecha = (fecha, largo = false) =>
  normalizarFecha(fecha).toLocaleDateString(
    'es-CO',
    largo
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { day: '2-digit', month: 'short' }
  );

const obtenerHoyIsoColombia = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const construirEtiquetaJornada = (fecha) => {
  if (!fecha) return 'Predicción vigente';
  const hoy = obtenerHoyIsoColombia();
  return fecha === hoy
    ? 'La predicción que se tiene para hoy es esta'
    : `La predicción que se tiene para el ${formatearFecha(fecha, true)} es esta`;
};

const obtenerNivelConfianza = (confianza = 0) => {
  if (confianza >= 75) return 'alta';
  if (confianza >= 60) return 'media';
  return 'baja';
};

const obtenerResumenConfianza = (confianza = 0) => {
  const nivel = obtenerNivelConfianza(confianza);
  if (nivel === 'alta') return 'La señal luce firme y consistente.';
  if (nivel === 'media') return 'La señal sirve como guía, pero conviene contrastarla con el mercado de hoy.';
  return 'La señal es suave. Úsala solo como referencia y no como decisión única.';
};

const obtenerColorError = (item) => {
  if (!item?.tieneResultadoReal || item.errorAbsoluto == null) {
    return {
      fondo: 'bg-[#F5EFE7]',
      borde: 'ring-[#E2D6C7]',
      texto: 'text-[#7B6654]',
      etiqueta: 'Aún sin validar',
    };
  }

  if (item.errorAbsoluto <= 10000) {
    return {
      fondo: 'bg-[#E8F6EC]',
      borde: 'ring-[#B9DFC5]',
      texto: 'text-[#256D3D]',
      etiqueta: 'Error bajo',
    };
  }

  if (item.errorAbsoluto <= 30000) {
    return {
      fondo: 'bg-[#FFF2DB]',
      borde: 'ring-[#E7CB8A]',
      texto: 'text-[#9A6B11]',
      etiqueta: 'Error medio',
    };
  }

  return {
    fondo: 'bg-[#FDEDE4]',
    borde: 'ring-[#EABFA7]',
    texto: 'text-[#A04A2B]',
    etiqueta: 'Error alto',
  };
};

const obtenerLecturaError = (item) => {
  if (!item?.tieneResultadoReal || item.errorAbsoluto == null) {
    return 'Aún no hay precio real para comparar esta predicción.';
  }

  if (item.errorAbsoluto <= 10000) {
    return 'La predicción estuvo muy cerca del precio real.';
  }

  if (item.errorAbsoluto <= 30000) {
    return 'La predicción quedó cerca del precio real.';
  }

  return 'La diferencia fue amplia frente al precio real.';
};

const construirLecturaMercado = (resumen) => {
  if (!resumen) return null;

  const diferencia = Number(resumen.precioestimado || 0) - Number(resumen.precioActualFnc || 0);
  const variacion = Number(resumen.variacionPorcentual || 0);
  const confianza = Number(resumen.confianza || 0);
  const nivelConfianza = obtenerNivelConfianza(confianza);

  if (resumen.tendencia === 'sube') {
    return {
      titular: 'El mercado da señales de mejora para la próxima jornada.',
      productor:
        diferencia > 0
          ? 'Si no estás urgido por vender, podría valer la pena comparar hoy contra lo que pagarían mañana.'
          : 'Aunque la señal va al alza, el cambio esperado no luce grande. Conviene confirmar si esperar realmente mejora tu negocio.',
      comprador:
        diferencia > 0
          ? 'Si necesitas asegurar volumen, puede ser buen momento para cerrar compras hoy antes de una posible subida.'
          : 'Hay señales de subida, pero suaves. Puedes negociar sin perder de vista nuevas actualizaciones.',
      alerta:
        nivelConfianza === 'alta'
          ? 'La señal se ve firme.'
          : 'La señal existe, pero todavía merece seguimiento.',
    };
  }

  if (resumen.tendencia === 'baja') {
    return {
      titular: 'El mercado muestra riesgo de bajar en la próxima jornada.',
      productor:
        diferencia < 0
          ? 'Si hoy te sirve el precio, vender pronto puede ayudarte a evitar una posible baja mañana.'
          : 'La señal apunta a baja, pero el cambio esperado luce moderado. Compara con tus costos antes de decidir.',
      comprador:
        diferencia < 0
          ? 'Si puedes esperar, mañana podría abrir una ventana un poco mejor para comprar.'
          : 'Hay riesgo de baja, aunque no se ve brusca. Puedes esperar o negociar con calma.',
      alerta:
        nivelConfianza === 'alta'
          ? 'La señal de baja se ve consistente.'
          : 'La baja proyectada todavía no es contundente.',
    };
  }

  return {
    titular: 'Por ahora no se ve un cambio fuerte frente a hoy.',
    productor:
      variacion === 0
        ? 'Si ya tienes una oferta buena hoy, esperar no necesariamente cambiaría mucho el resultado.'
        : 'El precio podría moverse poco. Vale más comparar compradores que apostarle al tiempo.',
    comprador:
      'Para comprar, el escenario luce parejo. La ventaja puede estar más en negociar bien que en esperar.',
    alerta:
      nivelConfianza === 'alta'
        ? 'La lectura del mercado luce estable.'
        : 'El mercado sigue sin una dirección muy clara.',
  };
};

const sectionCard =
  'rounded-[30px] border border-[#E7D7C1] bg-[#FFF9F0] shadow-[0_16px_40px_rgba(89,63,39,0.08)]';

function StatCard({ icon: Icon, label, value, helper, tone = 'bg-white/70', valueClassName = '' }) {
  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#E8D9C5] p-4 sm:p-5 ${tone} shadow-[0_14px_30px_rgba(108,75,52,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(108,75,52,0.10)]`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]" />
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[linear-gradient(180deg,#F5E4CC_0%,#EED7B8_100%)] text-[#6C4B34] shadow-inner">
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A735B]">{label}</p>
        </div>
      </div>
      <div className={`mt-4 min-w-0 text-xl font-black leading-tight text-[#2F241C] sm:text-2xl ${valueClassName}`}>
        {value}
      </div>
      {helper ? <p className="mt-5 text-sm leading-relaxed text-[#6D5E53]">{helper}</p> : null}
    </article>
  );
}

function RangeValue({ minimo, maximo }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="rounded-[22px] bg-white/88 px-3 py-3 ring-1 ring-[#EADDCB] shadow-[0_8px_18px_rgba(108,75,52,0.04)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A735B]">Mínimo</p>
        <p className="mt-1 whitespace-nowrap text-[clamp(1.15rem,3vw,1.35rem)] font-black leading-none tracking-tight text-[#2F241C]">
          {formatCurrency(minimo)}
        </p>
      </div>
      <div className="rounded-[22px] bg-white/88 px-3 py-3 ring-1 ring-[#EADDCB] shadow-[0_8px_18px_rgba(108,75,52,0.04)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A735B]">Máximo</p>
        <p className="mt-1 whitespace-nowrap text-[clamp(1.15rem,3vw,1.35rem)] font-black leading-none tracking-tight text-[#2F241C]">
          {formatCurrency(maximo)}
        </p>
      </div>
    </div>
  );
}

function CompactCurrency({ value, signed = false }) {
  return (
    <span className="block whitespace-nowrap text-[clamp(1.75rem,4vw,2.35rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#2F241C]">
      {signed ? formatSignedCurrency(value) : formatCurrency(value)}
    </span>
  );
}

export default function Predicciones() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [rangoSeleccionado, setRangoSeleccionado] = useState(7);
  const [resumen, setResumen] = useState(null);
  const [predicciones, setPredicciones] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [infoConsulta, setInfoConsulta] = useState(null);

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
      setInfoConsulta(data);
    } catch (error) {
      if (error.response?.status === 404) {
        setPredicciones([]);
        setInfoConsulta(null);
      } else {
        console.error('Error al obtener predicciones por rango:', error);
      }
    } finally {
      setCargandoConsulta(false);
    }
  };

  const configResumen = tendenciaConfig[resumen?.tendencia] || tendenciaConfig.estable;
  const IconoTendencia = configResumen.icono;
  const esPrediccionUnica = infoConsulta?.modo === 'prediccion_unica';
  const lecturaMercado = construirLecturaMercado(resumen);
  const etiquetaJornada = construirEtiquetaJornada(resumen?.fecha);
  const amplitudEsperada = Math.max(
    0,
    Number(resumen?.preciomaximo || 0) - Number(resumen?.preciominimo || 0)
  );
  const variacionVsHoy = Number(resumen?.precioestimado || 0) - Number(resumen?.precioActualFnc || 0);
  const confianzaNivel = obtenerNivelConfianza(resumen?.confianza);
  const resumenConfianza = obtenerResumenConfianza(resumen?.confianza);

  const prediccionesEvaluadas = predicciones.filter((item) => item.tieneResultadoReal && item.errorAbsoluto != null);

  const datosGrafica = predicciones.map((item) => ({
    fecha: formatearFecha(item.fecha),
    estimado: item.precioestimado,
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

  const errorPromedio =
    prediccionesEvaluadas.length > 0
      ? Math.round(
          prediccionesEvaluadas.reduce((acc, item) => acc + Number(item.errorAbsoluto || 0), 0) /
            prediccionesEvaluadas.length
        )
      : 0;

  useEffect(() => {
    const datosPagina = {
      prediccionResumen: resumen
        ? {
            fecha: resumen.fecha,
            precioEstimado: resumen.precioestimado,
            precioMinimo: resumen.preciominimo,
            precioMaximo: resumen.preciomaximo,
            tendencia: resumen.tendencia,
            confianza: resumen.confianza,
            mensaje: resumen.mensaje,
            explicacion: resumen.explicacion,
            variacionPorcentual: resumen.variacionPorcentual,
            estrategia: resumen.estrategiaAplicada,
            holdoutMape: resumen.holdoutMape,
          }
        : null,
      historialPredicciones: consultaRealizada
        ? {
            diasConsultados: predicciones.length,
            rangoSeleccionado,
            promedio,
            minimo,
            maximo,
            confianzaPromedio,
            diasEvaluados: prediccionesEvaluadas.length,
            errorPromedio,
          }
        : null,
    };

    window.__kaffiPageData = datosPagina;

    return () => {
      if (window.__kaffiPageData === datosPagina) {
        delete window.__kaffiPageData;
      }
    };
  }, [
    resumen,
    consultaRealizada,
    predicciones.length,
    rangoSeleccionado,
    promedio,
    minimo,
    maximo,
    confianzaPromedio,
    prediccionesEvaluadas.length,
    errorPromedio,
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#FAEED8_0%,#F2E1C6_38%,#FCF7F0_100%)] text-[#2F241C]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5 md:px-8 md:py-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#261B15_0%,#4B3224_48%,#866045_100%)] px-5 py-7 text-[#FAF4EB] shadow-[0_26px_80px_rgba(47,36,28,0.22)] sm:px-6 md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,214,153,0.14),transparent_28%)]" />
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E8D8C1]">
                Lectura del mercado
              </span>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
                Una pantalla pensada para entender la predicción sin enredarse
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#E8DCCB] sm:text-base">
                Mira rápido si el precio pinta mejor, peor o parecido, entiende qué podría convenirle al cafetero y al comprador, y revisa qué tan cerca ha estado el modelo frente a la realidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
              <Link
                to="/precios"
                className="inline-flex items-center justify-center rounded-2xl bg-[#F3E5CE] px-5 py-3 text-sm font-bold text-[#2F241C] shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition hover:bg-[#F8EDD9]"
              >
                Volver a precios
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#D7C2A7]">Predicción vigente</p>
                <p className="mt-1 text-sm font-semibold text-[#FAF4EB]">
                  {resumen?.fecha ? formatearFecha(resumen.fecha, true) : 'Esperando datos'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <article className={`${sectionCard} overflow-hidden`}>
            <div className={`bg-gradient-to-br ${configResumen.tono} p-5 sm:p-6`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">Señal principal</p>

                  {cargandoResumen ? (
                    <p className="mt-4 text-sm text-[#6D5E53]">Cargando predicción...</p>
                  ) : resumen ? (
                    <>
                      <p className="mt-4 text-sm font-semibold text-[#6A543F]">{etiquetaJornada}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[#6A543F]">
                            Para el {formatearFecha(resumen.fecha, true)}
                          </p>
                          <p className="mt-2 text-4xl font-black tracking-tight text-[#2F241C] sm:text-5xl">
                            {formatCurrency(resumen.precioestimado)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${configResumen.fondo} ${configResumen.color}`}>
                          <IconoTendencia size={16} />
                          {configResumen.etiqueta}
                        </span>
                      </div>
                      <p className="mt-4 max-w-2xl text-lg font-bold leading-tight text-[#433226]">
                        {lecturaMercado?.titular}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#665549]">
                        {resumen.explicacion || resumen.mensaje}
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-[#6D5E53]">No hay predicción disponible por ahora.</p>
                  )}
                </div>

                {resumen ? (
                  <div className="min-w-full rounded-[28px] bg-[#FFFDF7]/75 p-4 ring-1 ring-[#E7D6BF] sm:min-w-80 lg:max-w-xs">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
                      Qué tan confiable se ve
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E0C8] text-[#6C4B34]">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#2F241C]">{resumen.confianza}%</p>
                        <p className="text-sm font-semibold capitalize text-[#6A543F]">{confianzaNivel}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#6D5E53]">{resumenConfianza}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {resumen ? (
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <StatCard
                  icon={BadgeDollarSign}
                  label="Rango esperado"
                  value={<RangeValue minimo={resumen.preciominimo} maximo={resumen.preciomaximo} />}
                  helper="Es la franja donde el modelo ve más probable que se mueva el precio."
                  tone="bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(252,245,235,0.98)_100%)]"
                  valueClassName="text-base"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Cambio frente a hoy"
                  value={<CompactCurrency value={variacionVsHoy} signed />}
                  helper="Compara el valor esperado con el precio FNC usado como base."
                  tone="bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(249,238,220,0.98)_100%)]"
                  valueClassName={variacionVsHoy >= 0 ? 'text-[#256D3D]' : 'text-[#A04A2B]'}
                />
                <StatCard
                  icon={Target}
                  label="Base de hoy"
                  value={<CompactCurrency value={resumen.precioActualFnc} />}
                  helper="Es el dato de referencia desde el cual parte esta jornada proyectada."
                  tone="bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(252,245,235,0.98)_100%)]"
                />
                <StatCard
                  icon={ChartNoAxesCombined}
                  label="Movimiento posible"
                  value={<CompactCurrency value={amplitudEsperada} />}
                  helper={lecturaMercado?.alerta}
                  tone="bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(249,238,220,0.98)_100%)]"
                />
              </div>
            ) : null}
          </article>

          <article className={`${sectionCard} bg-[linear-gradient(180deg,#FFF6E8_0%,#F5E3BE_100%)] p-5 sm:p-6`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">Mirar varios días</p>
            <h2 className="mt-3 text-2xl font-black leading-tight text-[#2F241C]">
              Revisa si la señal se mantiene o cambia bastante
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6A543F]">
              Aquí no estás viendo puro número: la idea es que compares periodos y notes si el mercado viene tranquilo o si está más inquieto.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {RANGOS.map((dias) => (
                <button
                  key={dias}
                  onClick={() => setRangoSeleccionado(dias)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    rangoSeleccionado === dias
                      ? 'bg-[#2F241C] text-[#F9F3EA] shadow-[0_8px_18px_rgba(47,36,28,0.18)]'
                      : 'bg-[#FAF0DF] text-[#6B5A4D] hover:bg-[#F5E5D0]'
                  }`}
                >
                  {dias} días
                </button>
              ))}
            </div>

            <button
              onClick={() => ejecutarConsulta(rangoSeleccionado)}
              disabled={cargandoConsulta}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#2F241C] px-5 py-3 text-sm font-bold text-[#F7F1E8] transition hover:bg-[#443126] disabled:opacity-60 sm:w-auto"
            >
              {cargandoConsulta ? 'Consultando...' : `Ver lectura de ${rangoSeleccionado} días`}
            </button>

            <div className="mt-6 space-y-3">
              <div className="rounded-[22px] bg-white/65 p-4 ring-1 ring-[#E3C897]">
                <p className="text-sm font-semibold text-[#5F452C]">Si vas a vender café</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6A543F]">
                  {lecturaMercado?.productor ||
                    'Mira primero cuánto te cambia realmente el precio frente a hoy antes de decidir esperar.'}
                </p>
              </div>
              <div className="rounded-[22px] bg-white/65 p-4 ring-1 ring-[#E3C897]">
                <p className="text-sm font-semibold text-[#5F452C]">Si vas a comprar café</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6A543F]">
                  {lecturaMercado?.comprador ||
                    'Compara el ritmo del mercado antes de cerrar volumen o salir a buscar mejor precio.'}
                </p>
              </div>
              <div className="rounded-[22px] bg-[#2F241C] p-4 text-[#F8F2E8] shadow-[0_12px_24px_rgba(47,36,28,0.14)]">
                <p className="text-sm font-semibold text-[#E8D8C1]">Kaffi recomienda</p>
                <p className="mt-2 text-sm leading-relaxed text-[#F5EBDD]">
                  Úsalo como guía. Si ves mucho rango o poca confianza, vale más validar con el mercado de hoy que decidir solo por la predicción.
                </p>
              </div>
            </div>
          </article>
        </section>

        {consultaRealizada && (
          <>
            {esPrediccionUnica ? (
              <section className="mt-6 rounded-[28px] border border-[#DFC18E] bg-[#FFF8EC] p-5 text-sm leading-relaxed text-[#5E4B3A] shadow-[0_10px_24px_rgba(96,73,47,0.06)]">
                {infoConsulta?.mensaje || 'Por ahora el modelo FNC híbrido solo tiene una predicción real disponible.'}
              </section>
            ) : null}

            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={CalendarDays}
                label="Días consultados"
                value={predicciones.length}
                helper="Cantidad de jornadas que entraron en el tramo que elegiste."
              />
              <StatCard
                icon={BadgeDollarSign}
                label="Promedio del período"
                value={formatCurrency(promedio)}
                helper="Da una idea rápida de la zona media en la que se estaría moviendo."
                tone="bg-[#FFF7EC]"
              />
              <StatCard
                icon={ShieldCheck}
                label="Confianza media"
                value={`${confianzaPromedio}%`}
                helper="Promedio general de firmeza dentro del rango consultado."
              />
              <StatCard
                icon={CircleAlert}
                label="Error promedio real"
                value={prediccionesEvaluadas.length > 0 ? formatCurrency(errorPromedio) : 'Sin dato'}
                helper="Solo aparece cuando ya hay precio real para comparar lo que predijo el modelo."
                tone="bg-[#FFF7EC]"
              />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article className={`${sectionCard} p-5 sm:p-6`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
                      Recorrido del precio esperado
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#6D5E53]">
                      La línea oscura muestra el valor más probable y la franja clara ayuda a leer el techo del mercado.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F8EFE2] px-3 py-1 text-xs font-semibold text-[#6A543F] ring-1 ring-[#E5D3BC]">
                    {rangoSeleccionado} días
                  </span>
                </div>

                {cargandoConsulta ? (
                  <div className="mt-6 h-72 animate-pulse rounded-3xl bg-[#F5EBDD]" />
                ) : predicciones.length === 0 ? (
                  <p className="mt-6 text-sm text-[#6D5E53]">No encontramos predicciones para ese rango.</p>
                ) : (
                  <div className="mt-6 h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={datosGrafica} margin={{ left: 0, right: 10, top: 6, bottom: 0 }}>
                        <defs>
                          <linearGradient id="maxRange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DAB47A" stopOpacity={0.36} />
                            <stop offset="95%" stopColor="#DAB47A" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="estimadoRange" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6C4B34" stopOpacity={0.36} />
                            <stop offset="95%" stopColor="#6C4B34" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E7D6BF" strokeDasharray="4 4" />
                        <XAxis dataKey="fecha" tick={{ fill: '#8A735B', fontSize: 12 }} />
                        <YAxis
                          tick={{ fill: '#8A735B', fontSize: 12 }}
                          width={86}
                          tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 18,
                            border: '1px solid #E3D0B8',
                            background: '#FFF9F1',
                          }}
                          formatter={(valor) => formatCurrency(valor)}
                        />
                        <Area
                          type="monotone"
                          dataKey="maximo"
                          stroke="#D0A56B"
                          strokeWidth={1.5}
                          fill="url(#maxRange)"
                        />
                        <Area
                          type="monotone"
                          dataKey="estimado"
                          stroke="#6C4B34"
                          strokeWidth={3}
                          fill="url(#estimadoRange)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className={`${sectionCard} bg-[linear-gradient(180deg,#FFF8EC_0%,#F5E7CD_100%)] p-5 sm:p-6`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5428]">
                  Cómo leer este período
                </p>
                {predicciones.length === 0 ? (
                  <p className="mt-4 text-sm text-[#6A543F]">Haz una consulta para ver la lectura del rango.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[22px] bg-white/72 p-4 ring-1 ring-[#E4D0B3]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">Techo del tramo</p>
                      <p className="mt-1 text-2xl font-black text-[#2F241C]">{formatCurrency(maximo)}</p>
                    </div>
                    <div className="rounded-[22px] bg-white/72 p-4 ring-1 ring-[#E4D0B3]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">Piso del tramo</p>
                      <p className="mt-1 text-2xl font-black text-[#2F241C]">{formatCurrency(minimo)}</p>
                    </div>
                    <div className="rounded-[22px] bg-white/72 p-4 ring-1 ring-[#E4D0B3]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">Lectura simple</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#6A543F]">
                        {maximo - minimo > 60000
                          ? 'Se ve un mercado inquieto. Conviene seguirlo de cerca antes de tomar decisiones más grandes.'
                          : 'Se ve un mercado relativamente controlado. Puede pesar más una buena negociación que esperar demasiado.'}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            </section>

            <section className="mt-8">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#2F241C] sm:text-3xl">Día por día</h2>
                  <p className="text-sm text-[#705F51]">
                    Aquí ya puedes ver cuánto predijo el modelo, cuánto terminó valiendo realmente y qué tan cerca quedó.
                  </p>
                </div>
                <span className="self-start rounded-full bg-[#F8EFE2] px-3 py-1 text-xs font-semibold text-[#6A543F] ring-1 ring-[#E5D3BC]">
                  Historial comparado
                </span>
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {predicciones.map((item) => {
                    const config = tendenciaConfig[item.tendencia] || tendenciaConfig.estable;
                    const Icono = config.icono;
                    const nivel = obtenerNivelConfianza(item.confianza);
                    const colorError = obtenerColorError(item);

                    return (
                      <article
                        key={item._id || item.fecha}
                        className="overflow-hidden rounded-[28px] border border-[#E7D6BF] bg-[linear-gradient(180deg,#FFFDF8_0%,#F7EFE3_100%)] shadow-[0_14px_30px_rgba(96,73,47,0.08)]"
                      >
                        <div className={`bg-gradient-to-r ${config.tono} p-5`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
                                {formatearFecha(item.fecha, true)}
                              </p>
                              <p className="mt-2 text-3xl font-black tracking-tight text-[#2F241C]">
                                {formatCurrency(item.precioestimado)}
                              </p>
                              <p className="mt-1 text-sm text-[#6D5E53]">Predicción del modelo</p>
                            </div>

                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${config.fondo} ${config.color}`}>
                              <Icono size={14} />
                              {config.etiqueta}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-[20px] bg-[#F4E6D6] px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Rango esperado</p>
                              <p className="mt-1 text-sm font-bold text-[#2F241C]">
                                {formatCurrency(item.preciominimo)} - {formatCurrency(item.preciomaximo)}
                              </p>
                            </div>
                            <div className="rounded-[20px] bg-[#EFE4D4] px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Precio real</p>
                              <p className="mt-1 text-sm font-bold text-[#2F241C]">
                                {item.tieneResultadoReal ? formatCurrency(item.precioReal) : 'Aún sin dato'}
                              </p>
                            </div>
                          </div>

                          <div className={`rounded-[22px] p-4 ring-1 ${colorError.fondo} ${colorError.borde}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">
                                Error de la predicción
                              </p>
                              <span className={`text-xs font-bold ${colorError.texto}`}>{colorError.etiqueta}</span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-[#2F241C]">
                              {item.tieneResultadoReal ? formatCurrency(item.errorAbsoluto) : 'Pendiente'}
                            </p>
                            {item.tieneResultadoReal && item.errorPorcentaje != null ? (
                              <p className="mt-1 text-xs text-[#6D5E53]">
                                Diferencia de {Number(item.errorPorcentaje).toFixed(2)}%
                              </p>
                            ) : null}
                            <p className="mt-3 text-sm leading-relaxed text-[#5F452C]">{obtenerLecturaError(item)}</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div className="rounded-[20px] bg-[#FFF8EC] px-4 py-3 ring-1 ring-[#E7D6BF]">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8A735B]">Confianza</p>
                              <p className="mt-1 text-lg font-black text-[#2F241C]">{item.confianza}%</p>
                              <p className="mt-1 text-xs font-semibold text-[#5F452C] capitalize">Señal {nivel}</p>
                            </div>
                            {item.tieneResultadoReal ? (
                              <span className="rounded-full bg-[#F7EFE4] px-3 py-2 text-center text-xs font-semibold text-[#6A543F] ring-1 ring-[#E3D0B8]">
                                {item.acertoRango ? 'Cayó en rango' : 'Quedó fuera del rango'}
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#F7EFE4] px-3 py-2 text-center text-xs font-semibold text-[#8A735B] ring-1 ring-[#E3D0B8]">
                                En espera de validación
                              </span>
                            )}
                          </div>
                        </div>
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
