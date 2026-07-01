import { useState } from 'react';
import { terminosSections } from '../Home/TerminosCondiciones.jsx';
import { privacySections } from '../Home/PoliticaPrivacidad.jsx';

    export default function TerminosModal({ abierto, onAceptar, onCerrar }) {
        const [tab, setTab] = useState('terminos');
    
    if (!abierto) return null;
    
    const secciones = tab === 'terminos' ? terminosSections : privacySections;
    
    return (
        <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog" aria-modal="true"
        >
        <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Encabezado */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7D9BF]">
            <h2 className="text-[#2C1A0E] font-black text-lg">Términos y política de privacidad</h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
                className="text-gray-400 hover:text-[#2C1A0E] text-xl leading-none">✕</button>
            </div>
    
            {/* Pestañas */}
            <div className="flex gap-2 px-6 pt-4 border-b border-[#E7D9BF]">
            <button type="button" onClick={() => setTab('terminos')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-xl -mb-px ${
                tab === 'terminos' ? 'border border-b-white border-[#E7D9BF] text-[#2C1A0E]' : 'text-gray-400'
                }`}>
                Términos de uso
            </button>
            <button type="button" onClick={() => setTab('privacidad')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-xl -mb-px ${
                tab === 'privacidad' ? 'border border-b-white border-[#E7D9BF] text-[#2C1A0E]' : 'text-gray-400'
                }`}>
                Política de privacidad
            </button>
            </div>
    
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {secciones.map((s) => (
                <section key={s.title}>
                <h3 className="text-sm font-black text-[#2F241C]">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#5E4B3A]">{s.text}</p>
                </section>
            ))}
            </div>
    
            {/* Pie con acciones */}
            <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t border-[#E7D9BF] bg-[#FCF8F1]">
            <button type="button" onClick={onCerrar}
                className="flex-1 py-2.5 rounded-xl border border-[#E7D9BF] text-sm font-semibold text-[#8B7355] hover:bg-white transition-colors">
                Cerrar
            </button>
            <button type="button" onClick={onAceptar}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-[#3D1F0F] to-[#7A4020] hover:opacity-90 transition-opacity">
                He leído y acepto
            </button>
            </div>
        </div>
        </div>
    );
    }
