# OfferHunter

Sistema de detección inteligente de ofertas reales en **cruceros.cl**.

No detecta solo descuentos aparentes, sino **verdaderas ofertas** comparando contra
histórico de precios con análisis estadístico (Z-score) y predicciones.

## Problema que resolvemos
El 70% de los "descuentos" en e-commerce son precios inflados artificialmente días
antes para mostrar un tachado falso. Cruceros además tienen volatilidad extrema:
una cabina puede bajar 40% si la naviera no llena el barco a 30 días de zarpar.
Detectar ese momento exacto manualmente es imposible.

## Qué hace OfferHunter
1. **Scrapea** cruceros.cl cada 6 horas y guarda histórico completo de precios.
2. **Identifica ofertas reales** con análisis estadístico (Z-score < -1.5, mínimos
   en ventana de 180 días, comparación entre tipos de cabina).
3. **Predice** mejor momento de compra usando estacionalidad y patrones históricos.
4. **Alerta** a usuarios suscritos vía email/push cuando aparece una oferta que
   cumple sus criterios.
5. **Visualiza** todo en un dashboard con charts históricos, predicciones,
   heatmaps de estacionalidad y KPIs.

## Decisión clave: free tier
Todo el sistema está diseñado para correr **gratis**:
- Supabase Free (Postgres 500MB, Auth, Storage 1GB, Edge Functions)
- GitHub Actions (2000 min/mes para scraping)
- Vercel Free (frontend)
- Resend Free (3000 emails/mes)

Esto fuerza decisiones de diseño (particionamiento manual, agregación de datos
viejos, sin servidor 24/7) que documentamos en `01-architecture.md`.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `01-architecture.md` | Arquitectura, diagrama, decisiones técnicas |
| `02-database-schema.md` | Esquema SQL completo y migraciones |
| `03-scraper-spec.md` | Spec del scraper, parsing, normalización |
| `04-frontend-spec.md` | Componentes, vistas, UX |
| `05-edge-functions-spec.md` | Edge Functions de Supabase |
| `06-folder-structure.md` | Estructura completa del repo |
| `07-roadmap-phases.md` | Fases de implementación |
| `08-coding-standards.md` | Estándares de código y convenciones |
| `09-deployment.md` | Setup local y despliegue |
