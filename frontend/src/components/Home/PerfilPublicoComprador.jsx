import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContex.jsx';

const TAGS = [
  { value: 'precio_justo', label: 'Precio justo' },
  { value: 'pago_puntual', label: 'Pago puntual' },
  { value: 'buen_trato', label: 'Buen trato' },
  { value: 'precio_real', label: 'Precio real' },
  { value: 'confiable', label: 'Confiable' },
  { value: 'bascula_justa', label: 'Báscula justa' },
];

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            background: (hover || valor) >= n ? '#FAEEDA' : 'transparent',
            border: '0.5px solid',
            borderColor: (hover || valor) >= n ? '#BA7517' : 'var(--color-border-secondary)',
            borderRadius: 'var(--border-radius-md)',
            padding: '6px 14px',
            cursor: onChange ? 'pointer' : 'default',
            fontSize: '18px',
            color: (hover || valor) >= n ? '#BA7517' : 'var(--color-text-secondary)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PerfilPublicoComprador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const [comprador, setComprador] = useState(null);
  const [precios, setPrecios] = useState([]);
  const [reseñas, setReseñas] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [tagsSeleccionados, setTagsSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerDatos();
  }, [id]);

  const obtenerDatos = async () => {
    try {
      const [compradorRes, reseñasRes] = await Promise.all([
        axios.get(`${API_URL}/api/comprador/${id}`),
        axios.get(`${API_URL}/api/resenas/comprador/${id}`),
      ]);
      setComprador(compradorRes.data);
      setReseñas(reseñasRes.data.reseñas || []);
      setPromedio(reseñasRes.data.promedio || 0);
      await obtenerPrecios(id);
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerPrecios = async (compradorId) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/precios/comprador/${compradorId}`);
      setPrecios(data);
    } catch (error) {
      console.error('Error al obtener precios:', error);
    }
  };

  const toggleTag = (tag) => {
    setTagsSeleccionados(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleEnviarReseña = async (e) => {
    e.preventDefault();
    if (calificacion === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar una calificación' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');
      await axios.post(`${API_URL}/api/resenas`, {
        productor: usuarioId,
        comprador: id,
        calificacion,
        comentario,
        tags: tagsSeleccionados,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMensaje({ tipo: 'exito', texto: '¡Reseña publicada correctamente!' });
      setCalificacion(0);
      setComentario('');
      setTagsSeleccionados([]);
      obtenerDatos();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al publicar la reseña';
      setMensaje({ tipo: 'error', texto: msg });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const renderEstrellas = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  const iniciales = (nombre) => nombre ? nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5ECD7' }}>
      <p style={{ color: '#8B7355' }}>Cargando...</p>
    </div>
  );

  if (!comprador) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5ECD7' }}>
      <p style={{ color: '#8B7355' }}>Comprador no encontrado</p>
    </div>
  );

  const precioActual = precios[0];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F1E3', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Botón volver */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8B7355', fontSize: '13px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
          <i className="fa-solid fa-arrow-left"></i> Volver
        </button>

        {/* Header */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--border-radius-md)', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '500', color: '#633806' }}>
              {iniciales(comprador.nombreempresa)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '18px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>{comprador.nombreempresa}</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{comprador.direccion || 'Dirección no registrada'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '22px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>{promedio}</p>
              <div style={{ color: '#BA7517', fontSize: '14px' }}>{renderEstrellas(promedio)}</div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{reseñas.length} reseñas</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border-tertiary)', margin: '1rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>
                {precioActual ? precioActual.preciocarga?.toLocaleString() : '---'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Precio/carga hoy</p>
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>
                {precioActual ? precioActual.preciokg?.toLocaleString() : '---'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>COP/kg</p>
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>
                {comprador.horario || 'No registrado'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Horario</p>
            </div>
          </div>
        </div>

        {/* Formulario reseña - solo productores */}
        {usuario?.rol === 'productor' && (
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 1rem', color: 'var(--color-text-primary)' }}>Dejar una reseña</p>

            {mensaje && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--border-radius-md)', marginBottom: '12px', fontSize: '13px', fontWeight: '500', background: mensaje.tipo === 'exito' ? '#EAF3DE' : '#FCEBEB', color: mensaje.tipo === 'exito' ? '#3B6D11' : '#A32D2D' }}>
                {mensaje.tipo === 'exito' ? '✅' : '❌'} {mensaje.texto}
              </div>
            )}

            <form onSubmit={handleEnviarReseña}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Calificación</p>
              <div style={{ marginBottom: '16px' }}>
                <Estrellas valor={calificacion} onChange={setCalificacion} />
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Tags (opcional)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {TAGS.map(tag => (
                  <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                    style={{
                      background: tagsSeleccionados.includes(tag.value) ? '#FAEEDA' : 'transparent',
                      border: '0.5px solid',
                      borderColor: tagsSeleccionados.includes(tag.value) ? '#BA7517' : 'var(--color-border-secondary)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: tagsSeleccionados.includes(tag.value) ? '#633806' : 'var(--color-text-secondary)',
                    }}>
                    {tag.label}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Comentario (opcional)</p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escribe tu experiencia con este comprador..."
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-secondary)', fontSize: '13px', resize: 'none', height: '80px', boxSizing: 'border-box', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}
              />
              <button type="submit" disabled={enviando}
                style={{ marginTop: '10px', width: '100%', padding: '10px', borderRadius: 'var(--border-radius-md)', background: '#2C1A0E', color: '#F5ECD7', fontSize: '13px', fontWeight: '500', border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </form>
          </div>
        )}

        {/* Si no está logueado */}
        {!usuario && (
          <div style={{ background: '#FFF8E7', border: '0.5px solid rgba(200,169,110,0.3)', borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-lock" style={{ color: '#C8A96E' }}></i>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>Inicia sesión para dejar una reseña</p>
            </div>
            <Link to="/login" style={{ background: '#2C1A0E', color: '#F5ECD7', padding: '8px 16px', borderRadius: 'var(--border-radius-md)', fontSize: '12px', fontWeight: '500', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Reseñas */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem' }}>
          <p style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 1rem', color: 'var(--color-text-primary)' }}>
            Reseñas ({reseñas.length})
          </p>

          {reseñas.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
              Aún no hay reseñas para este comprador
            </p>
          ) : (
            reseñas.map((r, i) => (
              <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: '#633806' }}>
                      {iniciales(`${r.productor?.nombre} ${r.productor?.apellido}`)}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '500', margin: 0, color: 'var(--color-text-primary)' }}>
                      {r.productor?.nombre} {r.productor?.apellido}
                    </p>
                  </div>
                  <div style={{ color: '#BA7517', fontSize: '13px' }}>{renderEstrellas(r.calificacion)}</div>
                </div>
                {r.comentario && (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>{r.comentario}</p>
                )}
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {r.tags.map((tag, j) => (
                      <span key={j} style={{ background: '#FAEEDA', color: '#633806', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>
                        {TAGS.find(t => t.value === tag)?.label || tag}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                  {new Date(r.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
