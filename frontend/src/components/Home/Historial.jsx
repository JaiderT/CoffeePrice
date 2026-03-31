function Historial() {
  return (
    <div className="min-h-screen bg-[#F5ECD7] px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[#2C1A0E] text-2xl font-bold">Historial de precios</h1>
        <p className="text-gray-500 text-sm mt-1">Tendencia histórica del precio del café</p>
        <div className="bg-white rounded-2xl p-8 mt-6 text-center shadow-sm">
          <i className="fa-solid fa-chart-line text-[#C8A96E] text-4xl mb-4"></i>
          <p className="text-[#2C1A0E] font-semibold">Próximamente</p>
          <p className="text-gray-400 text-sm mt-1">Esta función estará disponible pronto</p>
        </div>
      </div>
    </div>
  )
}
export default Historial;