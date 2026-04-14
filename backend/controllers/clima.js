const DESCRIPCIONES_CLIMA = {
  0: { descripcion: 'Cielo despejado', icono: '☀️' },
  1: { descripcion: 'Mayormente despejado', icono: '🌤️' },
  2: { descripcion: 'Parcialmente nublado', icono: '⛅' },
  3: { descripcion: 'Muy nublado', icono: '☁️' },
  45: { descripcion: 'Neblina', icono: '🌫️' },
  48: { descripcion: 'Neblina con escarcha', icono: '🌫️' },
  51: { descripcion: 'Llovizna ligera', icono: '🌦️' },
  53: { descripcion: 'Llovizna moderada', icono: '🌦️' },
  55: { descripcion: 'Llovizna intensa', icono: '🌧️' },
  56: { descripcion: 'Llovizna helada ligera', icono: '🌧️' },
  57: { descripcion: 'Llovizna helada intensa', icono: '🌧️' },
  61: { descripcion: 'Lluvia ligera', icono: '🌦️' },
  63: { descripcion: 'Lluvia moderada', icono: '🌧️' },
  65: { descripcion: 'Lluvia fuerte', icono: '🌧️' },
  66: { descripcion: 'Lluvia helada ligera', icono: '🌧️' },
  67: { descripcion: 'Lluvia helada intensa', icono: '🌧️' },
  71: { descripcion: 'Nevada ligera', icono: '🌨️' },
  73: { descripcion: 'Nevada moderada', icono: '🌨️' },
  75: { descripcion: 'Nevada fuerte', icono: '❄️' },
  77: { descripcion: 'Granos de nieve', icono: '🌨️' },
  80: { descripcion: 'Chubascos ligeros', icono: '🌦️' },
  81: { descripcion: 'Chubascos moderados', icono: '🌧️' },
  82: { descripcion: 'Chubascos fuertes', icono: '⛈️' },
  85: { descripcion: 'Chubascos de nieve ligeros', icono: '🌨️' },
  86: { descripcion: 'Chubascos de nieve fuertes', icono: '❄️' },
  95: { descripcion: 'Tormenta eléctrica', icono: '⛈️' },
  96: { descripcion: 'Tormenta con granizo ligero', icono: '⛈️' },
  99: { descripcion: 'Tormenta con granizo fuerte', icono: '⛈️' },
};

function interpretarClima(codigo) {
  const codigoNumero = Number(codigo);
  return DESCRIPCIONES_CLIMA[codigoNumero] || { descripcion: 'Condiciones variables', icono: '🌡️' };
}

function construirResumenClima(actual) {
  const { temperatura, lluvia, humedad, viento, descripcion } = actual;

  if (lluvia >= 8) return `Se reporta ${descripcion.toLowerCase()} con lluvias fuertes. Protege el café y evita exponer el grano.`;
  if (lluvia >= 1) return `Hay ${descripcion.toLowerCase()} con algo de lluvia. Conviene cubrir café y secado.`;
  if (humedad >= 85) return `La humedad está alta aunque el cielo esté ${descripcion.toLowerCase()}. Ojo con el secado del café.`;
  if (viento >= 20) return `Hay ${descripcion.toLowerCase()} y bastante viento. Revisa lonas, plásticos y cubiertas.`;
  if (temperatura >= 27) return `La jornada está cálida con ${descripcion.toLowerCase()}. Aprovecha para secado, pero vigila la humedad.`;

  return `El clima actual está ${descripcion.toLowerCase()} y se mantiene estable para la jornada.`;
}

export const getClima = async (req, res) => {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=1.85' +
      '&longitude=-76.05' +
      '&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weather_code' +
      '&daily=weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min' +
      '&timezone=America%2FBogota' +
      '&forecast_days=7';

    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    const data = await response.json();
    const climaActual = interpretarClima(data.current.weather_code);

    const actual = {
      temperatura: data.current.temperature_2m,
      humedad: data.current.relative_humidity_2m,
      viento: data.current.wind_speed_10m,
      lluvia: data.current.precipitation,
      codigo: Number(data.current.weather_code),
      descripcion: climaActual.descripcion,
      icono: climaActual.icono,
    };

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    res.json({
      actual: {
        ...actual,
        resumen: construirResumenClima(actual),
      },
      pronostico: data.daily.time.map((fecha, i) => {
        const climaDia = interpretarClima(data.daily.weather_code[i]);
        return {
          fecha,
          codigo: Number(data.daily.weather_code[i]),
          descripcion: climaDia.descripcion,
          icono: climaDia.icono,
          temp_max: data.daily.temperature_2m_max[i],
          temp_min: data.daily.temperature_2m_min[i],
          lluvia: data.daily.precipitation_sum[i],
        };
      })
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el clima', error: error.message });
  }
};
