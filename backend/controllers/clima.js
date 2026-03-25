export const getClima = async (req, res) => {
  try {
    const URL =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=1.85' +
      '&longitude=-76.05' +
      '&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weather_code' +
      '&daily=precipitation_sum,temperature_2m_max,temperature_2m_min' +
      '&timezone=America%2FBogota' +
      '&forecast_days=7'

    const response = await fetch(URL)
    const data = await response.json()

    res.json({
      actual: {
        temperatura:  data.current.temperature_2m,
        humedad:      data.current.relative_humidity_2m,
        viento:       data.current.wind_speed_10m,
        lluvia:       data.current.precipitation,
        descripcion:  interpretarClima(data.current.weather_code),
        icono:        iconoClima(data.current.weather_code),
      },
      pronostico: data.daily.time.map((fecha, i) => ({
        fecha,
        temp_max: data.daily.temperature_2m_max[i],
        temp_min: data.daily.temperature_2m_min[i],
        lluvia:   data.daily.precipitation_sum[i],
      }))
    })

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el clima', error: error.message })
  }
}

function interpretarClima(codigo) {
  if (codigo === 0)  return 'Despejado'
  if (codigo <= 3)   return 'Parcialmente nublado'
  if (codigo <= 48)  return 'Nublado'
  if (codigo <= 67)  return 'Lluvia'
  if (codigo <= 82)  return 'Aguacero'
  if (codigo <= 99)  return 'Tormenta'
  return 'Sin datos'
}

function iconoClima(codigo) {
  if (codigo === 0)  return '☀️'
  if (codigo <= 3)   return '⛅'
  if (codigo <= 48)  return '☁️'
  if (codigo <= 67)  return '🌧️'
  if (codigo <= 82)  return '⛈️'
  if (codigo <= 99)  return '🌩️'
  return '🌡️'
}