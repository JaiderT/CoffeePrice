import Reseña from "../models/reseña.js";

export function esIndiceUnicoSoloComprador(indice = {}) {
  const claves = Object.keys(indice.key || {});
  return Boolean(indice.unique && claves.length === 1 && indice.key.comprador === 1);
}

export async function asegurarIndicesReseñas() {
  try {
    const indices = await Reseña.collection.indexes();
    const indiceLegacy = indices.find(esIndiceUnicoSoloComprador);

    if (indiceLegacy) {
      await Reseña.collection.dropIndex(indiceLegacy.name);
      console.log(`[DB] Índice legacy eliminado en reseñas: ${indiceLegacy.name}`);
    }
  } catch (error) {
    if (error.code !== 26 && error.codeName !== "NamespaceNotFound") {
      throw error;
    }
  }

  await Reseña.createIndexes();
}
