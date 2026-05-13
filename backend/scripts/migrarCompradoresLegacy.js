import "dotenv/config";
import mongoose from "mongoose";
import Comprador from "../models/comprador.js";
import Usuario from "../models/usuario.js";
import Precio from "../models/precio.js";
import { ESTADOS_REVISION_COMPRADOR } from "../utils/compradorEstado.js";

const APPLY = process.argv.includes("--apply");

function resolverEstadoRevision(estadoUsuario) {
  if (estadoUsuario === "activo") return ESTADOS_REVISION_COMPRADOR.APROBADO;
  if (estadoUsuario === "rechazado") return ESTADOS_REVISION_COMPRADOR.RECHAZADO;
  return ESTADOS_REVISION_COMPRADOR.EN_REVISION;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Falta MONGODB_URI");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Mongo conectado. Modo: ${APPLY ? "APLICAR" : "SOLO REPORTE"}`);

  const compradores = await Comprador.find({}).lean();
  const usuariosIds = [...new Set(compradores.map((c) => c.usuario).filter(Boolean).map(String))];
  const usuarios = await Usuario.find({ _id: { $in: usuariosIds } })
    .select("estado rol nombre apellido email")
    .lean();
  const usuariosMap = new Map(usuarios.map((u) => [String(u._id), u]));

  const legacySinEstado = [];
  const sinUsuario = [];
  const conUsuarioNoActivo = [];
  const paraActualizar = [];

  for (const comprador of compradores) {
    const usuario = comprador.usuario ? usuariosMap.get(String(comprador.usuario)) : null;

    if (comprador.estadoRevision === undefined || comprador.estadoRevision === null) {
      legacySinEstado.push({
        compradorId: comprador._id,
        nombreempresa: comprador.nombreempresa,
        usuarioId: comprador.usuario || null,
        usuarioEstado: usuario?.estado || null,
      });

      if (usuario) {
        paraActualizar.push({
          compradorId: comprador._id,
          estadoRevision: resolverEstadoRevision(usuario.estado),
          motivoRevision: null,
        });
      }
    }

    if (!usuario) {
      sinUsuario.push({
        compradorId: comprador._id,
        nombreempresa: comprador.nombreempresa,
        usuarioId: comprador.usuario || null,
      });
      continue;
    }

    if (usuario.estado !== "activo") {
      conUsuarioNoActivo.push({
        compradorId: comprador._id,
        nombreempresa: comprador.nombreempresa,
        usuarioId: usuario._id,
        usuarioEstado: usuario.estado,
        usuarioEmail: usuario.email,
      });
    }
  }

  const precios = await Precio.find({})
    .select("comprador preciocarga tipocafe createdAt updatedAt")
    .lean();

  const compradoresMap = new Map(compradores.map((c) => [String(c._id), c]));
  const preciosSinComprador = [];
  const preciosConCompradorNoActivo = [];

  for (const precio of precios) {
    const comprador = precio.comprador ? compradoresMap.get(String(precio.comprador)) : null;
    if (!comprador) {
      preciosSinComprador.push({
        precioId: precio._id,
        compradorId: precio.comprador || null,
        preciocarga: precio.preciocarga,
        tipocafe: precio.tipocafe,
      });
      continue;
    }

    const usuario = comprador.usuario ? usuariosMap.get(String(comprador.usuario)) : null;
    if (!usuario || usuario.estado !== "activo") {
      preciosConCompradorNoActivo.push({
        precioId: precio._id,
        compradorId: comprador._id,
        nombreempresa: comprador.nombreempresa,
        usuarioId: comprador.usuario || null,
        usuarioEstado: usuario?.estado || null,
        tipocafe: precio.tipocafe,
        preciocarga: precio.preciocarga,
      });
    }
  }

  console.log("\n=== RESUMEN ===");
  console.log(`Compradores totales: ${compradores.length}`);
  console.log(`Legacy sin estadoRevision: ${legacySinEstado.length}`);
  console.log(`Compradores sin usuario enlazado: ${sinUsuario.length}`);
  console.log(`Compradores con usuario no activo: ${conUsuarioNoActivo.length}`);
  console.log(`Precios sin comprador válido: ${preciosSinComprador.length}`);
  console.log(`Precios con comprador/usuario no activo: ${preciosConCompradorNoActivo.length}`);

  if (legacySinEstado.length > 0) {
    console.log("\n=== LEGACY SIN estadoRevision ===");
    legacySinEstado.slice(0, 20).forEach((item) => console.log(JSON.stringify(item)));
  }

  if (sinUsuario.length > 0) {
    console.log("\n=== COMPRADORES SIN USUARIO ===");
    sinUsuario.slice(0, 20).forEach((item) => console.log(JSON.stringify(item)));
  }

  if (conUsuarioNoActivo.length > 0) {
    console.log("\n=== COMPRADORES CON USUARIO NO ACTIVO ===");
    conUsuarioNoActivo.slice(0, 20).forEach((item) => console.log(JSON.stringify(item)));
  }

  if (preciosSinComprador.length > 0) {
    console.log("\n=== PRECIOS SIN COMPRADOR VÁLIDO ===");
    preciosSinComprador.slice(0, 20).forEach((item) => console.log(JSON.stringify(item)));
  }

  if (preciosConCompradorNoActivo.length > 0) {
    console.log("\n=== PRECIOS CON COMPRADOR / USUARIO NO ACTIVO ===");
    preciosConCompradorNoActivo.slice(0, 20).forEach((item) => console.log(JSON.stringify(item)));
  }

  if (APPLY && paraActualizar.length > 0) {
    console.log(`\nAplicando ${paraActualizar.length} actualizaciones de estadoRevision...`);
    for (const item of paraActualizar) {
      await Comprador.updateOne(
        { _id: item.compradorId },
        {
          $set: {
            estadoRevision: item.estadoRevision,
            motivoRevision: item.motivoRevision,
          },
        }
      );
    }
    console.log("Actualización completada.");
  } else if (!APPLY) {
    console.log("\nNo se aplicaron cambios. Usa --apply para guardar estadoRevision en compradores legacy.");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Error en migración legacy:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
