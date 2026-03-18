function Footer() {
  return (
    <div className="w-full bg-[#2C1A0E] py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Logo y descripción */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">☕</span>
            <span className="text-white text-xl font-bold">CoffePrice</span>
          </div>
          <p className="text-gray-400 text-sm max-w-xs">El precio justo del café, en tus manos. Para caficultores colombianos.</p>
        </div>

        {/* Links en grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { title: 'PLATAFORMA', links: ['Ver precios', 'Mapa de compradores', 'Configurar alertas', 'Calculadora'] },
            { title: 'INFORMACIÓN', links: ['Noticias del café', 'Tendencias', 'Precio FNC', 'Municipios'] },
            { title: 'SOPORTE', links: ['Centro de ayuda', 'Contacto', 'Términos de uso', 'Privacidad'] },
          ].map((col, i) => (
            <div key={i}>
              <p className="text-[#C8A96E] text-xs font-semibold mb-3">{col.title}</p>
              {col.links.map((link, j) => (
                <p key={j} className="text-gray-400 text-sm mb-2 hover:text-white cursor-pointer transition-colors">{link}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-xs">© 2025 CoffePrice · Hecho con ☕ en Colombia</p>
        </div>

      </div>
    </div>
  )
}

export default Footer
