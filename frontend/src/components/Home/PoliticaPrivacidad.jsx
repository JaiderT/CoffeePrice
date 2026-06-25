import ResponsivePageLayout from '../Layout/ResponsivePageLayout.jsx';

const privacySections = [
  {
    title: '1. Datos que recopilamos',
    text:
      'Podemos recopilar nombre, correo, teléfono, rol, información de ubicación comercial, mensajes enviados por formularios, datos técnicos de uso dentro de la plataforma y configuraciones necesarias para alertas, seguridad y funcionamiento de la cuenta. También podemos conservar registros básicos de actividad para soporte, auditoría interna y prevención de abuso.',
  },
  {
    title: '2. Para qué usamos la información',
    text:
      'Usamos los datos para permitir el acceso a la plataforma, responder solicitudes, mostrar funciones personalizadas, enviar alertas, mejorar el servicio, corregir errores, prevenir usos indebidos y mantener evidencia operativa cuando exista una reclamación o incidente. No usamos su información para fines ajenos al funcionamiento de CoffePrice sin base legal o consentimiento.',
  },
  {
    title: '3. Compartir información',
    text:
      'CoffePrice no vende datos personales. Solo compartimos información cuando es necesario para prestar el servicio, cumplir obligaciones legales, atender requerimientos de autoridad competente, responder conflictos formales o trabajar con proveedores tecnológicos bajo deberes de confidencialidad y medidas razonables de seguridad.',
  },
  {
    title: '4. Predicciones, analítica y datos de contexto',
    text:
      'Cuando CoffePrice utiliza datos para construir analítica, tendencias o predicciones, estos procesos buscan apoyar el funcionamiento del servicio y no identificar de forma pública decisiones privadas de cada usuario. Aun así, el usuario entiende que ningún modelo predictivo es perfecto y que el tratamiento de datos para estos fines puede depender de fuentes históricas, técnicas o externas.',
  },
  {
    title: '5. Conservación y seguridad',
    text:
      'Aplicamos medidas razonables de seguridad para proteger la información y conservarla solo durante el tiempo necesario para operar la plataforma, atender obligaciones legales, responder reclamaciones o resolver incidencias. Ningún sistema es infalible, por lo que no podemos prometer seguridad absoluta, aunque trabajamos para minimizar riesgos y accesos no autorizados.',
  },
  {
    title: '6. Derechos del titular',
    text:
      'Usted puede solicitar acceso, actualización, corrección o eliminación de sus datos cuando sea procedente. También puede revocar autorizaciones, presentar consultas, pedir información sobre el tratamiento realizado por CoffePrice y solicitar revisión cuando considere que existe un uso inadecuado de su información.',
  },
  {
    title: '7. Procedimiento para consultas y reclamos',
    text:
      'Las solicitudes relacionadas con acceso, actualización, corrección, supresión, revocatoria de autorización o reclamos sobre tratamiento de datos pueden presentarse al correo support.coffeprice@gmail.com o por el formulario de contacto de la plataforma. CoffePrice dará trámite a estas solicitudes por canales razonables, previa validación mínima de identidad cuando sea necesaria para proteger la información del titular.',
  },
  {
    title: '8. Datos de menores de edad',
    text:
      'CoffePrice no está dirigido de manera principal a niños, niñas o adolescentes. Si en algún caso se requiere tratar datos personales de menores, dicho tratamiento solo se realizará en los eventos permitidos por la ley colombiana y con las autorizaciones y salvaguardas que correspondan.',
  },
  {
    title: '9. Alcance y límites de esta política',
    text:
      'Esta política describe cómo tratamos datos personales dentro de CoffePrice, pero no sustituye las obligaciones propias de terceros, redes sociales, pasarelas, proveedores de correo o servicios externos enlazados desde la plataforma. Cuando el usuario salga de CoffePrice hacia otro servicio, aplicarán las políticas de ese tercero.',
  },
  {
    title: '10. Contacto y actualizaciones',
    text:
      'Para solicitudes relacionadas con tratamiento de datos personales puede escribir a support.coffeprice@gmail.com. Esta política entra en vigencia en mayo de 2026 y puede ajustarse cuando cambien nuestros procesos, funciones predictivas, integraciones o las obligaciones legales aplicables.',
  },
];

function PoliticaPrivacidad() {
  return (
    <ResponsivePageLayout>
      <main className="min-h-screen bg-[#F5ECD7] px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_40px_rgba(96,73,47,0.08)] ring-1 ring-[#E7D7BF] md:p-8">
            <span className="inline-flex rounded-full bg-[#F3E7D2] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A735B]">
              Privacidad
            </span>
            <h1 className="mt-4 text-3xl font-black text-[#2F241C] md:text-4xl">Política de privacidad</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5E4B3A] md:text-base">
              Aquí explicamos cómo tratamos la información personal de quienes usan CoffePrice, para qué fines la usamos y cuáles son sus límites dentro del servicio.
            </p>

            <div className="mt-8 space-y-5">
              {privacySections.map((section) => (
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

export default PoliticaPrivacidad;
