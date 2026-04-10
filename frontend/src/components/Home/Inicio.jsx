import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContex.jsx';
import axios from 'axios';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

function Inicio() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarComoFunciona, setMostrarComoFunciona] = useState(false);
  const comoFuncionaRef = useRef(null);
  const { usuario } = useAuth();

  const [reseñas, setReseñas] = useState([]);
  const [reseñasVisibles, setReseñasVisibles] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaReseña, setNuevaReseña] = useState({
    calificacion: 0,
    comentario: '',
    lugar: '',
  });
  const [hover, setHover] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensajeReseña, setMensajeReseña] = useState(null);

  const rutaPanel = usuario
    ? usuario.rol === 'admin'
      ? '/admin/perfil'
      : usuario.rol === 'comprador'
      ? '/comprador/dashboard'
      : '/perfil'
    : '/register';

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const [preciosRes, resenasRes] = await Promise.all([
          axios.get(`${API_URL}/api/precios`),
          axios.get(`${API_URL}/api/resenas-plataforma`),
        ]);

        setPrecios(preciosRes.data);
        setReseñas(resenasRes.data);
      } catch (error) {
        console.error('Error al obtener datos de inicio:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [API_URL]);

  useEffect(() => {
    if (reseñas.length <= 3) {
      setReseñasVisibles(reseñas);
      return;
    }

    const seleccionar = () => {
      const mezcladas = [...reseñas].sort(() => Math.random() - 0.5);
      setReseñasVisibles(mezcladas.slice(0, 3));
    };

    seleccionar();
    const intervalo = setInterval(seleccionar, 8000);
    return () => clearInterval(intervalo);
  }, [reseñas]);

  const handleEnviarReseña = async (e) => {
    e.preventDefault();

    if (nuevaReseña.calificacion === 0) {
      setMensajeReseña({
        tipo: 'error',
        texto: 'Debes seleccionar una calificación',
      });
      setTimeout(() => setMensajeReseña(null), 3000);
      return;
    }

    setEnviando(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/resenas-plataforma`, nuevaReseña, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMensajeReseña({
        tipo: 'exito',
        texto: 'Gracias. Tu reseña está pendiente de aprobación.',
      });
      setNuevaReseña({ calificacion: 0, comentario: '', lugar: '' });
      setMostrarFormulario(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al enviar la reseña';
      setMensajeReseña({ tipo: 'error', texto: msg });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensajeReseña(null), 4000);
    }
  };

  const handleComoFunciona = () => {
    setMostrarComoFunciona(true);
    setTimeout(() => {
      comoFuncionaRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderEstrellas = (n) =>
    '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  const medallas = ['🥇', '🥈', '🥉', '🏅'];

  const reseñasMostrar =
    reseñasVisibles.length > 0
      ? reseñasVisibles
      : [
          {
            calificacion: 5,
            comentario:
              'Antes me tocaba salir temprano a preguntar en varias compras. Ahora miro primero en el celular y salgo con una idea clara.',
            usuario: { nombre: 'Jaider', apellido: 'Muñoz' },
            lugar: 'Caficultor · Pitalito, Huila',
          },
          {
            calificacion: 5,
            comentario:
              'La alerta de precio me ayudó a vender mejor. Ese día sí sentí que estaba tomando la decisión con más información.',
            usuario: { nombre: 'María', apellido: 'Ospina' },
            lugar: 'Caficultora · Acevedo, Huila',
          },
          {
            calificacion: 4,
            comentario:
              'Es fácil de usar y me evita ir a ciegas. Uno ya sabe quién está pagando mejor antes de salir.',
            usuario: { nombre: 'Ernesto', apellido: 'Vargas' },
            lugar: 'Caficultor · La Argentina, Huila',
          },
        ];

  return (
    <div className="w-full bg-[linear-gradient(180deg,#F3E9DA_0%,#F7F2E8_42%,#EEE1CE_100%)]">
      <Navbar />

      <section className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#3A281C_0%,#5A3E2C_60%,#7A573D_100%)] px-5 py-6 text-[#FBF5EC] shadow-[0_28px_70px_rgba(58,40,28,0.22)] md:px-8 md:py-8 xl:px-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8D8C5]">
                  Hecho para caficultores
                </span>

                <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl xl:text-5xl">
                  Revisa cómo está el precio del café antes de salir a vender
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E9DDD0] md:text-base">
                  Mira quién está pagando mejor en tu zona, compara compradores y toma la decisión con más calma y más claridad.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#E1BE86] px-5 py-3 text-sm font-semibold text-[#2E2118] transition hover:bg-[#E9C996]"
                  >
                    Ver precios ahora
                  </Link>

                  {usuario ? (
                    <Link
                      to={rutaPanel}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Ir a mi panel
                    </Link>
                  ) : (
                    <button
                      onClick={handleComoFunciona}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Cómo funciona
                    </button>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-xl">
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xl font-black text-white">+240</p>
                    <p className="mt-1 text-[11px] text-[#D8CBBB]">
                      Compradores registrados
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <p className="text-xl font-black text-white">12</p>
                    <p className="mt-1 text-[11px] text-[#D8CBBB]">
                      Municipios activos
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#E1BE86] px-4 py-4 text-[#2E2118]">
                    <p className="text-xl font-black">Gratis</p>
                    <p className="mt-1 text-[11px] text-[#6F4E31]">
                      Para caficultores
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex">
                <div className="w-full rounded-[30px] bg-[linear-gradient(180deg,#FBF4EA_0%,#F3E5D2_100%)] p-4 text-[#2F241C] shadow-[0_16px_40px_rgba(0,0,0,0.14)] md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A735B]">
                        Así está el mercado hoy
                      </p>
                      <h2 className="mt-2 text-2xl font-black md:text-3xl">
                        ${precios[0]?.preciocarga?.toLocaleString() || '1.950.000'}
                      </h2>
                      <p className="mt-1 text-sm text-[#6D5E53]">
                        Precio destacado por carga en tu zona
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#EAF2E1] px-3 py-2 sm:text-right">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#5D7040]">
                        Señal de hoy
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#41592A]">
                        Conviene comparar
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-[#F8EEDB] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A735B]">
                      Mejores pagos del día
                    </p>

                    <div className="mt-3 space-y-3">
                      {cargando ? (
                        <p className="py-3 text-sm text-[#7B6A5C]">
                          Cargando precios...
                        </p>
                      ) : (
                        precios.slice(0, 4).map((item, i) => (
                          <div
                            key={i}
                            className="rounded-2xl bg-white/85 px-4 py-4 shadow-[0_6px_14px_rgba(96,73,47,0.05)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="mt-0.5 shrink-0 text-lg">
                                  {medallas[i]}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#2F241C]">
                                    {item.comprador?.nombreempresa}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-[#8B7A69]">
                                    {item.comprador?.direccion ||
                                      'Dirección disponible en precios'}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 text-sm font-black text-[#2F241C]">
                                ${item.preciocarga?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-[linear-gradient(135deg,#2F241C_0%,#453126_100%)] p-4 text-[#F7F1E8]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#D9C9AF]">
                      Lo importante
                    </p>
                    <p className="mt-2 text-base font-black md:text-lg">
                      Hoy sí vale la pena mirar antes de vender
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#E5D8C8]">
                      Entra al comparador y revisa con calma quién está pagando mejor en tu municipio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 rounded-[26px] bg-white/5 p-4 backdrop-blur-sm lg:grid-cols-3">
              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">
                  Consulta rápida
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Mira el mejor pago del día
                </p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Sin complicarte, en pocos segundos sabes cómo está el mercado.
                </p>
              </div>

              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">
                  Compara tranquilo
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Revisa varios compradores
                </p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Compara antes de moverte y evita vender sin referencia.
                </p>
              </div>

              <div className="rounded-[22px] bg-white/6 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D9C9AF]">
                  Decide mejor
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  Apóyate en la predicción
                </p>
                <p className="mt-1 text-sm text-[#E6D8C8]">
                  Mira si mañana podría subir, bajar o seguir parecido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {mostrarComoFunciona && (
        <section ref={comoFuncionaRef} className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl rounded-[30px] bg-[#F7EFE3] px-5 py-6 shadow-[0_12px_30px_rgba(110,86,60,0.08)] ring-1 ring-[#E7D7BF] md:px-8 md:py-8">
            <div className="flex justify-end">
              <button
                onClick={() => setMostrarComoFunciona(false)}
                className="rounded-full border border-[#8A6A49] px-4 py-2 text-xs font-semibold text-[#6B4A30] transition hover:bg-[#6B4A30] hover:text-white"
              >
                Ocultar
              </button>
            </div>

            <div className="mt-2 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B78E59]">
                Simple y rápido
              </p>
              <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
                Así funciona CoffePrice
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6D5E53]">
                En pocos pasos puedes revisar el mercado y decidir con más tranquilidad antes de vender.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  paso: '01',
                  titulo: 'Mira tu zona',
                  desc: 'Consulta los compradores activos del municipio donde estás.',
                },
                {
                  paso: '02',
                  titulo: 'Compara precios',
                  desc: 'Revisa quién está pagando mejor antes de moverte.',
                },
                {
                  paso: '03',
                  titulo: 'Apóyate en la predicción',
                  desc: 'Mira si mañana podría subir, bajar o seguir parecido.',
                },
                {
                  paso: '04',
                  titulo: 'Entra para más funciones',
                  desc: 'Al iniciar sesión puedes ver más detalles, alertas y otras ayudas.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-white px-4 py-4 shadow-[0_10px_24px_rgba(96,73,47,0.07)] ring-1 ring-[#E7D7BF]"
                >
                  <span className="inline-flex rounded-full bg-[#F3E5CE] px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#7A5428]">
                    {item.paso}
                  </span>
                  <h3 className="mt-4 text-base font-black text-[#2F241C]">
                    {item.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6D5E53]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B78E59]">
              Lo que dicen los caficultores
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#2F241C] md:text-3xl">
              Voces del campo
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6D5E53]">
              Caficultores que ya usan CoffePrice para revisar el mercado antes de vender.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reseñasMostrar.map((item, i) => (
              <div
                key={i}
                className="rounded-[26px] bg-[#FCF7F0] p-5 shadow-[0_12px_24px_rgba(96,73,47,0.06)] ring-1 ring-[#E7D7BF]"
              >
                <p className="text-lg text-[#C8A96E]">
                  {renderEstrellas(item.calificacion)}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[#5F5247]">
                  "{item.comentario}"
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDBA83] text-sm font-bold text-white">
                    {item.usuario?.nombre?.[0]}
                    {item.usuario?.apellido?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2F241C]">
                      {item.usuario?.nombre} {item.usuario?.apellido}
                    </p>
                    <p className="text-xs text-[#8B7A69]">
                      {item.lugar || 'Caficultor · Colombia'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-xl">
            {mensajeReseña && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  mensajeReseña.tipo === 'exito'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {mensajeReseña.texto}
              </div>
            )}

            {!mostrarFormulario ? (
              usuario ? (
                <div className="text-center">
                  <button
                    onClick={() => setMostrarFormulario(true)}
                    className="inline-flex rounded-2xl border border-[#C8A96E] bg-white px-6 py-3 text-sm font-semibold text-[#2F241C] transition hover:bg-[#FFF8E7]"
                  >
                    Dejar mi reseña sobre CoffePrice
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-[#7A6B5F]">
                  <Link
                    to="/login"
                    className="font-semibold text-[#B78E59] hover:underline"
                  >
                    Inicia sesión
                  </Link>{' '}
                  para dejar tu reseña
                </p>
              )
            ) : (
              <div className="rounded-[26px] border border-[#E7D9BF] bg-white p-5 shadow-[0_12px_24px_rgba(96,73,47,0.06)]">
                <h3 className="text-base font-black text-[#2F241C]">
                  ¿Cómo ha sido tu experiencia con CoffePrice?
                </h3>

                <form onSubmit={handleEnviarReseña} className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">
                    Calificación
                  </p>

                  <div className="mb-4 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setNuevaReseña({ ...nuevaReseña, calificacion: n })
                        }
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        className={`h-10 w-10 rounded-xl border text-lg transition-all ${
                          (hover || nuevaReseña.calificacion) >= n
                            ? 'border-[#C8A96E] bg-[#FFF8E7] text-[#C8A96E]'
                            : 'border-gray-200 bg-white text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">
                    Tu experiencia
                  </p>
                  <textarea
                    required
                    value={nuevaReseña.comentario}
                    onChange={(e) =>
                      setNuevaReseña({
                        ...nuevaReseña,
                        comentario: e.target.value,
                      })
                    }
                    placeholder="Cuéntanos cómo te ha ayudado CoffePrice..."
                    className="mb-4 h-24 w-full resize-none rounded-xl border border-gray-200 bg-[#F7F1E3] px-4 py-3 text-sm text-[#2C1A0E] placeholder-gray-400 focus:border-[#C8A96E] focus:outline-none"
                  />

                  <p className="mb-2 text-xs font-semibold uppercase text-[#8B7355]">
                    Tu ubicación (opcional)
                  </p>
                  <input
                    type="text"
                    value={nuevaReseña.lugar}
                    onChange={(e) =>
                      setNuevaReseña({ ...nuevaReseña, lugar: e.target.value })
                    }
                    placeholder="Ej: Caficultor · Pitalito, Huila"
                    className="mb-4 w-full rounded-xl border border-gray-200 bg-[#F7F1E3] px-4 py-3 text-sm text-[#2C1A0E] placeholder-gray-400 focus:border-[#C8A96E] focus:outline-none"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 rounded-xl bg-[#2C1A0E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3D1F0F] disabled:opacity-60"
                    >
                      {enviando ? 'Enviando...' : 'Enviar reseña'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 md:px-8 md:pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#DDBA83_0%,#E9D3A9_52%,#F4E7D0_100%)] px-5 py-8 text-center text-[#2F241C] shadow-[0_18px_40px_rgba(125,90,45,0.12)] md:px-8 md:py-10">
            <h2 className="text-3xl font-black leading-tight md:text-4xl">
              Consulta el mercado con más calma antes de vender
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#5E4B3A] md:text-base">
              Revisa precios, compara compradores y apóyate en una referencia más clara antes de tomar una decisión.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {usuario ? (
                <Link
                  to={rutaPanel}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-7 py-3 font-semibold text-white transition hover:bg-[#463227]"
                >
                  Ir a mi panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#2F241C] px-7 py-3 font-semibold text-white transition hover:bg-[#463227]"
                  >
                    Crear cuenta gratis
                  </Link>
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#7A5A38] px-7 py-3 font-semibold text-[#2F241C] transition hover:bg-white/30"
                  >
                    Ver precios sin registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Inicio;
