import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
 
const STORAGE_KEY = "cookieConsent"; // "accepted" | "rejected"
 
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
 
  useEffect(() => {
    const consentimiento = localStorage.getItem(STORAGE_KEY);
    if (!consentimiento) {
      setVisible(true);
    }
  }, []);
 
  function guardarConsentimiento(valor) {
    localStorage.setItem(STORAGE_KEY, valor);
    localStorage.setItem(`${STORAGE_KEY}Fecha`, new Date().toISOString());
    setVisible(false);
    // Si luego conectan Google Analytics u otro tracker opcional,
    // aquí es donde lo activarían solo si valor === "accepted".
  }
 
  if (!visible) return null;
 
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#C8814A]/30 bg-[#FAF7F2] shadow-xl">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <div className="flex shrink-0 items-center justify-center rounded-full bg-[#3D1F0F]/10 p-3">
            <Cookie className="h-6 w-6 text-[#7A4020]" />
          </div>
 
          <div className="flex-1 text-sm text-[#3B1F0A]">
            <p className="leading-relaxed">
              Usamos cookies propias y necesarias para mantener tu sesión activa
              (inicio de sesión, preferencias) y, si las aceptas, para analizar el
              uso de la plataforma y mejorar tu experiencia. Puedes leer más en
              nuestra{" "}
              <Link to="/politica-de-privacidad#cookies" className="font-semibold underline">
                Política de Privacidad
              </Link>
              .
            </p>
 
            {detalleAbierto && (
              <ul className="mt-3 space-y-1 text-xs text-[#6b5444]">
                <li>
                  <strong>Esenciales (siempre activas):</strong> cookie de sesión
                  (auth_token) para mantenerte autenticado. No se pueden desactivar
                  porque la plataforma no funciona sin ellas.
                </li>
                <li>
                  <strong>Opcionales:</strong> análisis de uso, si en el futuro se
                  habilitan herramientas de medición.
                </li>
              </ul>
            )}
 
            <button
              type="button"
              onClick={() => setDetalleAbierto((v) => !v)}
              className="mt-2 text-xs font-medium text-[#7A4020] underline underline-offset-2"
            >
              {detalleAbierto ? "Ocultar detalle" : "Ver qué cookies usamos"}
            </button>
          </div>
 
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => guardarConsentimiento("rejected")}
              className="rounded-xl border border-[#3D1F0F]/20 px-4 py-2 text-sm font-medium text-[#3B1F0A] transition hover:bg-[#3D1F0F]/5"
            >
              Solo esenciales
            </button>
            <button
              type="button"
              onClick={() => guardarConsentimiento("accepted")}
              className="rounded-xl bg-gradient-to-r from-[#3D1F0F] to-[#7A4020] px-4 py-2 text-sm font-semibold text-[#FAF7F2] transition hover:opacity-90"
            >
              Aceptar todas
            </button>
          </div>
 
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => guardarConsentimiento("rejected")}
            className="absolute right-3 top-3 text-[#3B1F0A]/50 hover:text-[#3B1F0A] sm:static sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
