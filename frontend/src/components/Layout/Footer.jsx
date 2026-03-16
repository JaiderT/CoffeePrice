function Footer() {
  return (
    <div className="w-full bg-[#2C1A0E] py-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">☕</span>
              <span className="text-white text-xl font-bold">CoffePrice</span>
            </div>
            <p className="text-gray-400 text-sm">El precio justo del café, en tus manos. Para caficultores colombianos.</p>
          </div>
          {[
            { title: 'PLATAFORMA', links: ['Ver precios', 'Mapa de compradores', 'Configurar alertas', 'Calculadora'] },
            { title: 'INFORMACIÓN', links: ['Noticias del café', 'Tendencias', 'Precio FNC', 'Municipios'] },
            { title: 'SOPORTE', links: ['Centro de ayuda', 'Contacto', 'Términos de uso', 'Privacidad'] },
          ].map((col, i) => (
            <div key={i}>
              <p className="text-[#C8A96E] text-xs font-semibold mb-4">{col.title}</p>
              {col.links.map((link, j) => (
                <p key={j} className="text-gray-400 text-sm mb-2 hover:text-white cursor-pointer">{link}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6">
          <p className="text-gray-500 text-xs">© 2025 CoffePrice · Hecho con ☕ en Colombia</p>
        </div>
      </div>
    </div>
  )
}

export default Footer;
