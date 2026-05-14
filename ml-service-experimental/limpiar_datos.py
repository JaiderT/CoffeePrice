from pipeline_fnc_hibrido import load_raw_kc, load_raw_trm, save_clean_market_data

print("=" * 60)
print("  LIMPIANDO DATOS DE MERCADO")
print("=" * 60)

print("\n1. Consolidando KC desde archivos fuente...")
df_kc = load_raw_kc()
save_start_kc = df_kc["ds"].min().date()
save_end_kc = df_kc["ds"].max().date()
print(f"   Registros KC limpios: {len(df_kc)}")
print(f"   Rango KC: {save_start_kc} a {save_end_kc}")
print(df_kc.tail(3).to_string(index=False))

print("\n2. Consolidando TRM desde archivos fuente...")
df_trm = load_raw_trm()
save_start_trm = df_trm["ds"].min().date()
save_end_trm = df_trm["ds"].max().date()
print(f"   Registros TRM limpios: {len(df_trm)}")
print(f"   Rango TRM: {save_start_trm} a {save_end_trm}")
print(df_trm.tail(3).to_string(index=False))

save_clean_market_data(df_kc, df_trm)

print("\n3. Archivos actualizados")
print("   -> datos/precios_limpios.csv")
print("   -> datos/trm_limpias.csv")
print("\nOK: limpieza completada")
