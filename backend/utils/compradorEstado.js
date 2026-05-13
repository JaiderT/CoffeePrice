export const ESTADOS_REVISION_COMPRADOR = {
  PERFIL_INCOMPLETO: "perfilIncompleto",
  EN_REVISION: "enRevision",
  APROBADO: "aprobado",
  RECHAZADO: "rechazado",
};

export function tieneRevisionLegacyAprobada(comprador) {
  return comprador?.estadoRevision === undefined || comprador?.estadoRevision === null;
}

export function esCompradorAprobado(usuario, comprador) {
  const legacySinUsuario = !usuario && tieneRevisionLegacyAprobada(comprador);

  return (
    legacySinUsuario ||
    (
      usuario?.estado === "activo" &&
      (
        comprador?.estadoRevision === ESTADOS_REVISION_COMPRADOR.APROBADO ||
        tieneRevisionLegacyAprobada(comprador)
      )
    )
  );
}
