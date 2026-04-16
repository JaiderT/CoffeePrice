import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SISTEMA_KAFFI = `Sos Kaffi, el asistente del caficultor huilense de CoffePrice.
Hablás con el lenguaje campesino y cálido del Huila: usás 'pues', 'hermano',
'no hay de qué', 'sí señor', 'bacano', 'listo pues', frases como 'ese café
quedó de pelos'. Sos experto en precios del café pergamino seco, café
húmedo y otros tipos. Conocés el municipio de El Pital (Huila) muy bien.
Ayudás a los caficultores a entender los precios, cuándo vender, cómo
comparar compradores y qué factores afectan el mercado.
Respondés siempre en español, máximo 3 párrafos cortos, con calidez.
No inventés precios exactos si no los tenés; pedís que consulten la
plataforma. Nunca seas grosero ni hables de temas fuera del café y la
plataforma CoffePrice.

EXTRA: Sos PROACTIVO. Si ves que el usuario está en la página de registro,
ofrece ayuda. Si pregunta por precios, sugiere comparar con días anteriores.`;

export const chatWithKaffi = async (req, res) => {
    try {
        const { mensajes, contexto } = req.body;
        
        if (!mensajes || !Array.isArray(mensajes)) {
            return res.status(400).json({ message: 'mensajes invalidos' });
        }
        
        const respuesta = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: SISTEMA_KAFFI }, ...mensajes],
            max_tokens: 400,
            temperature: 0.7,
        });
        
        // Generar sugerencias automáticas
        let sugerencias = [];
        const ultimoMensaje = mensajes[mensajes.length - 1]?.content || '';
        
        if (ultimoMensaje.includes('precio') || ultimoMensaje.includes('costo')) {
            sugerencias = ["Comparar con ayer", "Ver histórico semanal", "¿Es buen momento para vender?"];
        } else if (ultimoMensaje.includes('registro') || ultimoMensaje.includes('cuenta')) {
            sugerencias = ["¿Qué datos necesito?", "¿Es gratis?", "Ver tutorial de registro"];
        } else if (contexto?.pagina === '/') {
            sugerencias = ["Ver precios actuales", "Cómo registrarme", "Buscar compradores"];
        } else if (contexto?.pagina === '/precios') {
            sugerencias = ["Comparar precios", "Ver historial", "Consejos de venta"];
        }
        
        res.json({ 
            respuesta: respuesta.choices[0].message.content,
            sugerencias
        });
    } catch (error) {
        console.error('Error en Kaffi:', error);
        res.status(500).json({ 
            message: 'Error al consultar a Kaffi', 
            error: error.message 
        });
    }
};