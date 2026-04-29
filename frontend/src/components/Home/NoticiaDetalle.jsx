import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/useAuth.js';
import Navbar from '../Layout/Navbar.jsx';
import Sidebar from '../Layout/Sidebar.jsx';
import Footer from '../Layout/Footer.jsx';

const API_URL = import.meta.env.VITE_API_URL;

const categoriaBadgeColors = {
  mercado: 'bg-amber-50 text-amber-700',
  internacional: 'bg-blue-50 text-blue-700',
  clima: 'bg-sky-50 text-sky-700',
  fnc: 'bg-purple-50 text-purple-700',
  produccion: 'bg-green-50 text-green-700',
  consejos: 'bg-[#FFF3E0] text-[#C8A96E]',
  el_pital: 'bg-emerald-50 text-emerald-700',
};

const categoriaEmoji = {
  mercado: '📈',
  internacional: '🌎',
  clima: '🌧️',
  fnc: '🏛️',
  produccion: '🌱',
  consejos: '💡',
  el_pital: '⛰️',
};

export default function NoticiaDetalle() {
  const { id } = useParams();
  const { usuario, cargando: cargandoAuth } = useAuth();
  const [noticia, setNoticia] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const cargarNoticia = async () => {
      setCargando(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/noticias/${id}`);
        if (activo) setNoticia(data);
      } catch (error) {
        console.error('Error al obtener noticia:', error);
        if (activo) setNoticia(null);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarNoticia();
    return () => {
      activo = false;
    };
  }, [id]);

  const parrafos = useMemo(() => (
    (noticia?.contenido || '')
      .split(/\n\s*\n/)
      .map((parte) => parte.trim())
      .filter(Boolean)
      .slice(0, 3)
  ), [noticia]);

  const formatearFecha = (valor) => new Date(valor).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const contenido = (
    <div className="w-full bg-[#F5ECD7] py-12 md:py-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-7">
        <Link to="/noticias" className="inline-flex items-center gap-2 text-[#3D1F0F] text-sm font-semibold hover:text-[#C8A96E] transition-colors mb-6">
          <span>←</span>
          <span>Volver a noticias</span>
        </Link>

        {cargando && (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center text-gray-400 text-sm">
            Cargando noticia...
          </div>
        )}

        {!cargando && !noticia && (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center">
            <h2 className="text-[#2C1A0E] text-xl font-bold">No se encontro la noticia</h2>
            <p className="text-gray-500 text-sm mt-2">Puede que haya sido eliminada o que el enlace ya no este disponible.</p>
          </div>
        )}

        {!cargando && noticia && (
          <article className="bg-white rounded-3xl overflow-hidden shadow-sm">
            {noticia.imagen && (
              <div className="h-64 md:h-80 overflow-hidden bg-[#e2d9c6]">
                <img src={noticia.imagen} alt={noticia.titulo} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoriaBadgeColors[noticia.categoria] || 'bg-gray-100 text-gray-600'}`}>
                  {categoriaEmoji[noticia.categoria] || '☕'} {noticia.categoria}
                </span>
                <span className="text-xs text-gray-400">{formatearFecha(noticia.publishedAt || noticia.createdAt)}</span>
                <span className="text-xs text-gray-400">{noticia.fuente || 'CoffePrice'}</span>
              </div>

              <h1 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold leading-tight">
                {noticia.titulo}
              </h1>

              <p className="mt-5 text-[#6B5A48] text-base leading-7 bg-[#FBF6EC] border border-[#E7D9BF] rounded-2xl p-5">
                {noticia.resumen}
              </p>

              <div className="mt-8 space-y-5">
                {parrafos.map((parrafo, index) => (
                  <p key={index} className="text-gray-700 text-base leading-8">
                    {parrafo}
                  </p>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-[#E7D9BF] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[#2C1A0E] text-sm font-semibold">Resumen breve en CoffePrice</p>
                  <p className="text-gray-400 text-xs mt-1">Aqui tienes el contexto esencial de la noticia en tres parrafos para lectura rapida.</p>
                </div>
                {noticia.sourceUrl && (
                  <a
                    href={noticia.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#3D1F0F] text-white text-sm font-semibold hover:bg-[#5a2e18] transition-colors"
                  >
                    Ir a la fuente original
                  </a>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );

  return (
    <>
      {!cargandoAuth && usuario ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="ml-16 flex-1">{contenido}</div>
        </div>
      ) : !cargandoAuth && !usuario ? (
        <div className="bg-[#2C1A0E]">
          <Navbar />
          {contenido}
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen bg-[#F7F1E3] flex items-center justify-center">
          <p className="text-[#8B7355]">Cargando...</p>
        </div>
      )}
    </>
  );
}
