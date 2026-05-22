import ResponsivePageLayout from '../Layout/ResponsivePageLayout.jsx';

const privacySections = [
  {
    title: '1. Datos que recopilamos',
    text:
      'Podemos recopilar nombre, correo, telefono, rol, informacion de ubicacion comercial, mensajes enviados por formularios, datos tecnicos de uso dentro de la plataforma y configuraciones necesarias para alertas, seguridad y funcionamiento de la cuenta. Tambien podemos conservar registros basicos de actividad para soporte, auditoria interna y prevencion de abuso.',
  },
  {
    title: '2. Para que usamos la informacion',
    text:
      'Usamos los datos para permitir el acceso a la plataforma, responder solicitudes, mostrar funciones personalizadas, enviar alertas, mejorar el servicio, corregir errores, prevenir usos indebidos y mantener evidencia operativa cuando exista una reclamacion o incidente. No usamos su informacion para fines ajenos al funcionamiento de CoffePrice sin base legal o consentimiento.',
  },
  {
    title: '3. Compartir informacion',
    text:
      'CoffePrice no vende datos personales. Solo compartimos informacion cuando es necesario para prestar el servicio, cumplir obligaciones legales, atender requerimientos de autoridad competente, responder conflictos formales o trabajar con proveedores tecnologicos bajo deberes de confidencialidad y medidas razonables de seguridad.',
  },
  {
    title: '4. Predicciones, analitica y datos de contexto',
    text:
      'Cuando CoffePrice utiliza datos para construir analitica, tendencias o predicciones, estos procesos buscan apoyar el funcionamiento del servicio y no identificar de forma publica decisiones privadas de cada usuario. Aun asi, el usuario entiende que ningun modelo predictivo es perfecto y que el tratamiento de datos para estos fines puede depender de fuentes historicas, tecnicas o externas.',
  },
  {
    title: '5. Conservacion y seguridad',
    text:
      'Aplicamos medidas razonables de seguridad para proteger la informacion y conservarla solo durante el tiempo necesario para operar la plataforma, atender obligaciones legales, responder reclamaciones o resolver incidencias. Ningun sistema es infalible, por lo que no podemos prometer seguridad absoluta, aunque trabajamos para minimizar riesgos y accesos no autorizados.',
  },
  {
    title: '6. Derechos del titular',
    text:
      'Usted puede solicitar acceso, actualizacion, correccion o eliminacion de sus datos cuando sea procedente. Tambien puede revocar autorizaciones, presentar consultas, pedir informacion sobre el tratamiento realizado por CoffePrice y solicitar revision cuando considere que existe un uso inadecuado de su informacion.',
  },
  {
    title: '7. Procedimiento para consultas y reclamos',
    text:
      'Las solicitudes relacionadas con acceso, actualizacion, correccion, supresion, revocatoria de autorizacion o reclamos sobre tratamiento de datos pueden presentarse al correo support.coffeprice@gmail.com o por el formulario de contacto de la plataforma. CoffePrice dara tramite a estas solicitudes por canales razonables, previa validacion minima de identidad cuando sea necesaria para proteger la informacion del titular.',
  },
  {
    title: '8. Datos de menores de edad',
    text:
      'CoffePrice no esta dirigido de manera principal a niños, niñas o adolescentes. Si en algun caso se requiere tratar datos personales de menores, dicho tratamiento solo se realizara en los eventos permitidos por la ley colombiana y con las autorizaciones y salvaguardas que correspondan.',
  },
  {
    title: '9. Alcance y limites de esta politica',
    text:
      'Esta politica describe como tratamos datos personales dentro de CoffePrice, pero no sustituye las obligaciones propias de terceros, redes sociales, pasarelas, proveedores de correo o servicios externos enlazados desde la plataforma. Cuando el usuario salga de CoffePrice hacia otro servicio, aplicaran las politicas de ese tercero.',
  },
  {
    title: '10. Contacto y actualizaciones',
    text:
      'Para solicitudes relacionadas con tratamiento de datos personales puede escribir a support.coffeprice@gmail.com. Esta politica entra en vigencia en mayo de 2026 y puede ajustarse cuando cambien nuestros procesos, funciones predictivas, integraciones o las obligaciones legales aplicables.',
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
            <h1 className="mt-4 text-3xl font-black text-[#2F241C] md:text-4xl">Politica de privacidad</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5E4B3A] md:text-base">
              Aqui explicamos como tratamos la informacion personal de quienes usan CoffePrice, para que fines la usamos y cuales son sus limites dentro del servicio.
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
