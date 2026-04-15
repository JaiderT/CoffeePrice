import { Link } from "react-router-dom";
export default function NotFound() {
return (
    <div className="min-h-screen bg-[#F5ECD7] flex flex-col items-center justify-center px-4">
        <div className="text-8xl mb-6">☕</div>
        <h1 className="text-[#2C1A0E] text-4xl font-bold mb-2">404</h1>
        <p className="text-gray-500 text-lg mb-8">Esta página se perdió en la cosecha</p>
        <Link to="/" className="bg-[#3D1F0F] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#5a2e18] transition-colors">
        Volver al inicio
        </Link>
    </div>
);
}
