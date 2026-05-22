import { Link } from 'react-router-dom';
import ResponsivePageLayout from '../Layout/ResponsivePageLayout.jsx';

const helpTopics = [
  {
    title: 'Consultar precios',
    description: 'Revise precios por carga y por kilo, compare compradores activos y valide la referencia FNC del dia.',
    cta: { label: 'Ir a precios', to: '/precios' },
  },
  {
    title: 'Crear alertas',
    description: 'Configure un precio objetivo y reciba aviso cuando un comprador publique ese valor.',
    cta: { label: 'Crear cuenta para alertas', to: '/register' },
  },
  {
    title: 'Entender predicciones',
    description: 'Mire la tendencia esperada del mercado para decidir con mas contexto si vender hoy o esperar.',
    cta: { label: 'Activar acceso a predicciones', to: '/register' },
  },
  {
    title: 'Hablar con soporte',
    description: 'Si tiene dudas con su cuenta o encuentra un error, puede escribirnos por contacto o WhatsApp.',
    cta: { label: 'Contactar soporte', to: '/contacto' },
  },
];

const commonQuestions = [
  {
    question: '¿Necesito cuenta para revisar precios?',
    answer:
      'No. Puede entrar a la vista de precios sin registrarse. La cuenta gratuita se necesita para alertas, historial y otras funciones personalizadas.',
  },
  {
    question: '¿Con que frecuencia cambia el precio?',
    answer:
      'Los compradores actualizan sus valores durante el dia. CoffePrice muestra la informacion mas reciente disponible en la plataforma.',
  },
  {
    question: '¿Que hago si no veo mi boton o una opcion del menu?',
    answer:
      'En celular ahora encontrara los accesos principales en la barra inferior y el resto dentro del boton "Mas". Si aun no aparece, recargue la pagina o cierre y abra sesion de nuevo.',
  },
  {
    question: '¿Como contacto al equipo?',
    answer:
      'Puede usar el formulario de contacto, escribir por WhatsApp al +57 315 279 8859 o enviar un correo a support.coffeprice@gmail.com.',
  },
];

function CentroAyuda() {
  return (
    <ResponsivePageLayout>
      <main className="min-h-screen bg-[#F5ECD7]">
        <section className="px-4 py-8 md:px-8 md:py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[32px] bg-[linear-gradient(135deg,#3A281C_0%,#5A3E2C_60%,#7A573D_100%)] px-6 py-8 text-[#FBF5EC] shadow-[0_24px_60px_rgba(58,40,28,0.18)] md:px-8">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8D8C5]">
                Centro de ayuda
              </span>
              <h1 className="mt-4 text-3xl font-black md:text-4xl">Le ayudamos a usar CoffePrice sin enredos</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E9DDD0] md:text-base">
                Aqui reunimos las rutas mas utiles para consultar precios, entender el mercado y resolver dudas de la cuenta.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {helpTopics.map((topic) => (
                <div
                  key={topic.title}
                  className="rounded-[26px] border border-[#E7D9BF] bg-white p-5 shadow-[0_12px_26px_rgba(96,73,47,0.08)]"
                >
                  <h2 className="text-lg font-black text-[#2F241C]">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#5E4B3A]">{topic.description}</p>
                  <Link
                    to={topic.cta.to}
                    className="mt-5 inline-flex rounded-2xl bg-[#2F241C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#463227]"
                  >
                    {topic.cta.label}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-[26px] border border-[#E7D9BF] bg-[#FFFDF8] p-6">
                <h2 className="text-2xl font-black text-[#2F241C]">Preguntas frecuentes</h2>
                <div className="mt-5 space-y-3">
                  {commonQuestions.map((item) => (
                    <div key={item.question} className="rounded-2xl bg-[#F8F1E4] p-4">
                      <h3 className="text-sm font-bold text-[#2F241C]">{item.question}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#5E4B3A]">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-[#E7D9BF] bg-white p-6">
                <h2 className="text-2xl font-black text-[#2F241C]">Canales de soporte</h2>
                <div className="mt-5 space-y-3">
                  <a
                    href="https://wa.me/573152798859"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-[#E7D9BF] bg-[#F8F1E4] px-4 py-3 text-sm font-semibold text-[#2F241C] transition hover:border-[#C8A96E]"
                  >
                    WhatsApp
                    <span className="text-[#8A735B]">+57 315 279 8859</span>
                  </a>
                  <a
                    href="mailto:support.coffeprice@gmail.com"
                    className="flex items-center justify-between rounded-2xl border border-[#E7D9BF] bg-[#F8F1E4] px-4 py-3 text-sm font-semibold text-[#2F241C] transition hover:border-[#C8A96E]"
                  >
                    Correo
                    <span className="text-[#8A735B]">support.coffeprice@gmail.com</span>
                  </a>
                  <Link
                    to="/contacto"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#C8A96E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B8994E]"
                  >
                    Ir al formulario de contacto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ResponsivePageLayout>
  );
}

export default CentroAyuda;
