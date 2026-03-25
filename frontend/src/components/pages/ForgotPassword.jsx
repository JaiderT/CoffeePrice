import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send, Loader2, KeyRound, Shield } from "lucide-react";
import axios from "axios";

export default function ForgotPassword() {

    // Estado para el correo que escribe el usuario
    const [email, setEmail] = useState("");

    //muestra el spinner mientras se envia la peticion
    const [loading, setLoading] = useState(false);

    //muestra mensajes de exito o error al usuario
    const [message, setMessage] = useState ({ type: "", text: "" });

    //hook para redirigir a otra pagina
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();   //evita que el form recargue la pagina
        setLoading(true);  //activa el spinner
        setMessage({ type: "", text: "" }); //limpia mensajes anteriores

        try {
            const response = await axios.post(
                "http://localhost:8081/api/recuperar/solicitar-codigo",
                { email: email }
            );

            setMessage({
                type: "success",
                text: response.data.message || "Codigo enviado",
            });

            // espera 2 segundos y redirige - pasa el email por estado
            setTimeout(() => {
                navigate("/verify-code", {state: {email}});
            }, 2000);
        
        } catch (error) {
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Error al enviar",
            });
        } finally {
            setLoading(false); //siempre ejecuta, con o sin error
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-linear-to-br bg-[#FAF7F2]">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">

                    {/* ENCABEZAO */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-18 h-18 bg-linear-to-r bg-[#5d331d] rounded-full mb-4">
                        <svg className="w-15" viewBox="0 0 640 640"><path d="M184 48C170.7 48 160 58.7 160 72C160 110.9 183.4 131.4 199.1 145.1L200.2 146.1C216.5 160.4 224 167.9 224 184C224 197.3 234.7 208 248 208C261.3 208 272 197.3 272 184C272 145.1 248.6 124.6 232.9 110.9L231.8 109.9C215.5 95.7 208 88.1 208 72C208 58.7 197.3 48 184 48zM128 256C110.3 256 96 270.3 96 288L96 480C96 533 139 576 192 576L384 576C425.8 576 461.4 549.3 474.5 512L480 512C550.7 512 608 454.7 608 384C608 313.3 550.7 256 480 256L128 256zM480 448L480 320C515.3 320 544 348.7 544 384C544 419.3 515.3 448 480 448zM320 72C320 58.7 309.3 48 296 48C282.7 48 272 58.7 272 72C272 110.9 295.4 131.4 311.1 145.1L312.2 146.1C328.5 160.4 336 167.9 336 184C336 197.3 346.7 208 360 208C373.3 208 384 197.3 384 184C384 145.1 360.6 124.6 344.9 110.9L343.8 109.9C327.5 95.7 320 88.1 320 72z"/></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Recuperar Contraseña
                        </h2>
                        <p className="text-gray-600">
                            Ingresa tu correo y te enviaremos un codigo
                        </p>
                    </div>
                    {/* FORMULARIO */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* CAMPO CORREO */}
                        <div>
                            <label htmlFor="recovery-email"
                            className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-2 text-gray-400" />
                            Correo electronico
                            </label>
                            <input
                            type="email"
                            id="recovery-email"
                            placeholder="tu@email.com"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900" required
                            />
                        </div>

                        {/* MENSAJE EXITO O ERROR */}
                        {message.text &&  (
                            <div className={`p-4 rounded-lg ${
                                message.type === "success"
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : "bg-red-50 border border-red-200 text-red-800"
                            }`}>
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* BOTON ENVIAR*/}
                        <button type="submit" disabled={loading}
                        style={{ background: "linear-gradient(135deg, #3D1F0F, #7A4020)" }}
                        className="w-full bg-linear-to-r
                        text-white py-3 rounded-lg font-semibold
                        disabled:opacity-50 flex items-center justify-center cursor-pointer">
                            {loading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Enviando...</>
                            ) : (
                                <><Send className="w-5 h-5 mr-2" /> ENVIAR CODIGO</>
                            )}
                        </button>
                    </form>

                    {/*BOTON VOLVER*/}
                    <div className="mt-6 text-center">
                        <button type="button" onClick={() => navigate("/login")}
                        className="font-semibold inline-flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver al inicio de sesion
                        </button>
                    </div>
                </div>
            </div>
        </main>   
    );
} // fin ForgotPassword