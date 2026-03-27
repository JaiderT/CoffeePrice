import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

export default function Noticias() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  return (
    <div>
        <Navbar />
    <div className="w-full bg-[#F5ECD7] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#C8A96E] text-xs font-semibold uppercase tracking-widest">Al día con el campo</p>
            <h2 className="text-[#2C1A0E] text-3xl md:text-4xl font-bold mt-2">Noticias del café</h2>
            <p className="text-gray-500 text-sm mt-2">Lo más relevante del sector cafetero colombiano e internacional.</p>
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 flex-wrap mb-8">
          {['Todas', 'Precios del café', 'Mercado internacional', 'Clima y cosechas', 'Noticias del sector'].map((cat, i) => (
            <button
              key={i}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                categoriaActiva === cat
                  ? 'bg-[#3D1F0F] text-white'
                  : 'bg-white text-[#3D1F0F] border border-[#D4B898] hover:bg-[#3D1F0F] hover:text-white'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Noticia destacada */}
          <div className="lg:col-span-2 bg-[#3D1F0F] rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6 md:p-8 flex flex-col justify-between h-full min-h-[260px]">
              <div>
                <span className="bg-[#C8A96E] text-[#3D1F0F] text-xs font-bold px-3 py-1 rounded-full">
                  📈 Precios del café
                </span>
                <h3 className="text-white text-xl md:text-2xl font-bold mt-4 leading-snug group-hover:text-[#C8A96E] transition-colors">
                  El precio interno del café supera los $2.000.000 por carga en varios municipios del Huila
                </h3>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                  Compradores de Pitalito, Acevedo y La Argentina registran los precios más altos del año, impulsados por la fuerte demanda externa y la reducción de inventarios.
                </p>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#C8A96E] rounded-full flex items-center justify-center text-xs">☕</div>
                  <span className="text-gray-400 text-xs">Redacción CoffePrice</span>
                </div>
                <span className="text-gray-500 text-xs">Hace 2 horas</span>
              </div>
            </div>
          </div>

          {/* Noticia 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-[#F5ECD7] h-32 flex items-center justify-center text-5xl">🌦️</div>
            <div className="p-5">
              <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                Clima y cosechas
              </span>
              <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                Fenómeno La Niña podría afectar la cosecha principal en el sur del Huila
              </h3>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                El IDEAM advierte lluvias por encima del promedio entre octubre y diciembre.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-400 text-xs">Cenicafé · IDEAM</span>
                <span className="text-gray-400 text-xs">Ayer</span>
              </div>
            </div>
          </div>

          {/* Noticia 3 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-[#F5ECD7] h-28 flex items-center justify-center text-5xl">🌍</div>
            <div className="p-5">
              <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                Mercado internacional
              </span>
              <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                Bolsa de Nueva York: el café arábico cierra semana al alza por tercer mes consecutivo
              </h3>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                El contrato "C" subió 3.2% impulsado por bajos inventarios en Brasil y Vietnam.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-400 text-xs">Reuters · Bloomberg</span>
                <span className="text-gray-400 text-xs">Hace 3 días</span>
              </div>
            </div>
          </div>

          {/* Noticia 4 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-[#F5ECD7] h-28 flex items-center justify-center text-5xl">🏛️</div>
            <div className="p-5">
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                Noticias del sector
              </span>
              <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                Federación Nacional de Cafeteros anuncia subsidio para renovación de cafetales en el Huila
              </h3>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                El programa beneficiará a más de 4.000 familias cafeteras con hasta $800.000 por hectárea renovada.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-400 text-xs">FNC Colombia</span>
                <span className="text-gray-400 text-xs">Esta semana</span>
              </div>
            </div>
          </div>

          {/* Noticia 5 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
            <div className="bg-[#F5ECD7] h-28 flex items-center justify-center text-5xl">📊</div>
            <div className="p-5">
              <span className="bg-[#FFF3E0] text-[#C8A96E] text-xs font-semibold px-3 py-1 rounded-full">
                📈 Precios del café
              </span>
              <h3 className="text-[#2C1A0E] font-bold text-sm mt-3 leading-snug group-hover:text-[#C8A96E] transition-colors">
                ¿Por qué el café colombiano cotiza por encima del promedio mundial este trimestre?
              </h3>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                Expertos explican el diferencial positivo del café suave colombiano frente a otros orígenes.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-400 text-xs">Portafolio</span>
                <span className="text-gray-400 text-xs">Esta semana</span>
              </div>
            </div>
          </div>

        </div>

        {/* Banner alerta */}
        <div className="mt-8 bg-[#3D1F0F] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🔔</span>
            <div>
              <p className="text-white font-bold text-sm">Recibe las noticias en tu celular</p>
              <p className="text-gray-400 text-xs mt-0.5">Activa las notificaciones y entérate cuando el precio suba o haya noticias importantes.</p>
            </div>
          </div>
          <button className="bg-[#C8A96E] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#B8994E] transition-colors whitespace-nowrap">
            🔔 Activar alertas
          </button>
        </div>

      </div>
    </div>
    <Footer />
    </div>
  );
}