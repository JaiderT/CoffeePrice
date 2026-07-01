// Lista centralizada de patrones ofensivos usada en todo el backend:

const PATRONES_OFENSIVOS = [
    /\bidiot[ao]s?\b/,
    /\bimbecil(?:es)?\b/,
    /\bestupid[oa]s?\b/,
    /\bpendej[oa]s?\b/,
    /\bmaric[ao]n(?:es)?\b/,
    /\bmarica\b/,
    /\bhijueputa\b/,
    /\bhpta\b/,
    /\bmalparid[oa]s?\b/,
    /\bgonorre?a\b/,
    /\bpiro+b[oa]s?\b/,
    /\bperr[oa]s?\b/,
    /\bput[ao]s?\b/,
    /\bculiad[oa]s?\b/,
    /\bverga\b/,
    /\bcallate\b/,
    /\bno sirves\b/,
    /\bque inutil\b/,
];

export function normalizarTexto(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
 
export function contieneLenguajeOfensivo(value = '') {
  const texto = normalizarTexto(value);
  return PATRONES_OFENSIVOS.some((patron) => patron.test(texto));
}
