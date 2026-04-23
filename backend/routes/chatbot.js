import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
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
plataforma CoffePrice.`;

router.post('/', async (req, res) => {
    try {
        const { mensajes } = req.body;
        if (!mensajes || !Array.isArray(mensajes)) {
            return res.status(400).json({ message: 'mensajes invalidos' });
        }
        const respuesta = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: SISTEMA_KAFFI }, ...mensajes],
            max_tokens: 400,
            temperature: 0.7,
        });
        res.json({ respuesta: respuesta.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar a kaffi', error: error.message});
    }
});

export default router;
