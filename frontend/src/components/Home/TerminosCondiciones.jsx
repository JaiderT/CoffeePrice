import ResponsivePageLayout from '../Layout/ResponsivePageLayout.jsx';

const sections = [
  {
    title: '1. Objeto del servicio',
    text:
      'CoffePrice ofrece informacion de precios, referencias del mercado, noticias, alertas y herramientas de apoyo para caficultores y compradores. El servicio tiene una finalidad informativa y de apoyo operativo. En ningun caso reemplaza la verificacion directa que cada usuario debe hacer antes de vender, comprar, negociar, transportar cafe o asumir cualquier compromiso economico.',
  },
  {
    title: '2. Uso responsable de la cuenta y del contenido',
    text:
      'Cada usuario es responsable de cuidar sus credenciales, mantener datos reales y no compartir accesos con terceros sin autorizacion. El uso indebido de la cuenta, la suplantacion, la carga de informacion falsa, la manipulacion de funcionalidades o el uso de la plataforma con fines engañosos puede generar suspension, limitacion o cierre definitivo del acceso.',
  },
  {
    title: '3. Publicacion de informacion por terceros',
    text:
      'Los compradores y usuarios que publiquen datos en CoffePrice declaran que la informacion entregada es veraz, actual y corresponde a condiciones reales del mercado. CoffePrice puede moderar, ocultar, corregir visualmente o retirar contenido que sea engañoso, ofensivo, ilegal, desactualizado o que genere riesgo para otros usuarios. La publicacion de un dato por un tercero no implica que CoffePrice lo garantice como exacto en todo momento.',
  },
  {
    title: '4. Naturaleza de precios, referencias, alertas y noticias',
    text:
      'Los precios publicados, referencias FNC, comparativos, alertas, noticias y demas datos visibles en la plataforma se presentan como informacion de apoyo. Pueden existir retrasos, errores humanos, omisiones, diferencias por municipio, cambios de ultima hora o inconsistencias provenientes de terceros o de procesos tecnicos. CoffePrice no garantiza que toda la informacion sea exacta, completa, permanente, disponible o vigente en tiempo real.',
  },
  {
    title: '5. Predicciones, tendencias y analitica',
    text:
      'Las predicciones, tendencias y calculos analiticos de CoffePrice se generan a partir de modelos, datos historicos, reglas internas o fuentes externas. Estas funciones pueden fallar, arrojar resultados imprecisos o no reflejar eventos inesperados del mercado. No constituyen consejo financiero, promesa de rentabilidad, recomendacion personalizada ni garantia de comportamiento futuro del precio del cafe. Cualquier decision tomada con base en estas predicciones es exclusiva responsabilidad del usuario.',
  },
  {
    title: '6. Limitacion de responsabilidad',
    text:
      'En la medida permitida por la ley aplicable, CoffePrice y sus administradores no responden por perdidas, negocios no concretados, decisiones comerciales equivocadas, variaciones de precio, lucro cesante, perjuicios indirectos o daños derivados del uso o de la confianza depositada en precios, noticias, alertas o predicciones mostradas en la plataforma. El usuario acepta que debe validar por su cuenta la informacion relevante antes de cerrar cualquier negocio.',
  },
  {
    title: '7. Disponibilidad, cambios y suspension del servicio',
    text:
      'Podemos actualizar, mejorar, suspender temporalmente o modificar funciones cuando sea necesario por mantenimiento, seguridad, ajustes legales, fallas tecnicas o evolucion del servicio. Haremos esfuerzos razonables para conservar la continuidad, pero no garantizamos disponibilidad absoluta, acceso ininterrumpido ni ausencia total de errores.',
  },
  {
    title: '8. Propiedad intelectual',
    text:
      'El nombre CoffePrice, su marca, interfaz, textos, bases visuales y componentes propios forman parte de la propiedad intelectual de la plataforma o de sus respectivos titulares. No esta permitido copiar, redistribuir, extraer bases de datos, revender informacion o explotar estos elementos sin autorizacion previa y expresa.',
  },
  {
    title: '9. Aceptacion, contacto y vigencia',
    text:
      'El uso de la plataforma implica la aceptacion de estos terminos. Si el usuario no esta de acuerdo, debe abstenerse de usar el servicio. Estos terminos aplican desde mayo de 2026 y pueden actualizarse en cualquier momento. Para consultas puede escribir a support.coffeprice@gmail.com o usar el formulario de contacto disponible en la plataforma.',
  },
  {
    title: '10. Recomendacion final al usuario',
    text:
      'Antes de tomar decisiones de venta, compra, cierre de negocio, fijacion de precios o transporte de cafe, el usuario debe confirmar por canales directos la informacion que considere critica. CoffePrice ayuda a orientar, pero la decision final y sus consecuencias economicas, comerciales o contractuales corresponden exclusivamente al usuario.',
  },
];

function TerminosCondiciones() {
  return (
    <ResponsivePageLayout>
      <main className="min-h-screen bg-[#F5ECD7] px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_40px_rgba(96,73,47,0.08)] ring-1 ring-[#E7D7BF] md:p-8">
            <span className="inline-flex rounded-full bg-[#F3E7D2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
              Legal
            </span>
            <h1 className="mt-4 text-3xl font-black text-[#2F241C] md:text-4xl">Terminos y condiciones</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5E4B3A] md:text-base">
              Estas condiciones regulan el uso de CoffePrice y dejan claro que la informacion publicada, incluidas las predicciones, puede contener errores y no debe tomarse como garantia de resultado.
            </p>

            <div className="mt-8 space-y-5">
              {sections.map((section) => (
                <section key={section.title} className="rounded-2xl bg-[#FCF7F0] p-5">
                  <h2 className="text-base font-black text-[#2F241C]">{section.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#5E4B3A]">{section.text}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </ResponsivePageLayout>
  );
}

export default TerminosCondiciones;
