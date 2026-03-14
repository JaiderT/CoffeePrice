
export default function Login () {
    return (

        <body className="bg-[#3B1F0A] min-h-screen flex">

            {/* PANEL IZQUIERDO */}

            <div className="hidden lg:flex flex-1 relative flex-col justify-center px-16 bg-linear-to-br from-[#3B1F0A] to-[#6B3A1F] text-white">
                <div className="flex items-center gap-3 mb-14">
                    <div className="w-12 h-12 bg-[#C8814A] rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        ☕️
                    </div>
                    <span className="text-2xl font-black font-serif">CoffePrice</span>

                </div>

                <h1 className="text-4xl font-black font-serif leading-tight mb-5">
                    Tu cafe merece <br/>
                    <span className="text-[#E8A870] italic">el mejor precio</span>
                </h1>

                <p className="text-white/70 max-w-md mb-12">
                Entra a CoffePrice y consulta en segundos cuanto pagan los compradores 
                de tu municipio si intermediarios.
                </p>

                <div className="flex gap-8">

                    <div>
                        <p className="text-2xl font-bold">+240</p>
                        <p className="text-sm text-white/60">Compradores</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-sm text-white/60">Municipios</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">Gratis</p>
                        <p className="text-sm text-white/60">Caficultores</p>
                    </div>

                </div>

            </div>

            {/* PANEL DERECHO */}

            <div className="w-full lg:w-130 bg-[#FBF7F0] flex flex-col justify-center px-10 py-12">
                <div className="bg-white rounded-xl shadow p-1 flex mb-10">

                    <button className="flex-1 py-2 rounded-lg bg-[#3B1F0A] text-white font-semibold">
                        Iniciar Sesion
                    </button>

                    <button className="flex-1 py-2 rounded-lg text-gray-500 font-semibold">
                        Crear cuenta
                    </button>

                </div>

                <h2 className="text-3xl font-black font-serif text-[#3B1F0A] mb-2">
                    !Bienvenido de nuevo¡
                </h2>

                <p className="text-gray-500 mb-8">
                    Entra a tu cuenta para ver los precios de tu zona
                </p>

                

            </div>
            
        </body>
                    
    );
}
