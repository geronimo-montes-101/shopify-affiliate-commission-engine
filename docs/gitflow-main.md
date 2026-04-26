# GitFlow simplificado centrado en `main`

Este flujo cumple con la expectativa de la prueba (Trunk-based / Feature Branch),
manteniendo `main` como rama principal estable y entregable.

## 1) Principios

- `main` siempre debe compilar y ser demostrable.
- Una rama por funcionalidad, corta y con objetivo unico.
- Integraciones frecuentes a `main` (PR pequeno y revisable).
- Commits atomicos, con mensaje claro y orientado a valor.

## 2) Estructura de ramas

- `main` -> rama troncal y estable
- `feat/*` -> nuevas funcionalidades
- `fix/*` -> correcciones puntuales
- `docs/*` -> cambios de documentacion

## 3) Orden recomendado para esta prueba

1. `feat/data-model-core`
2. `feat/affiliate-admin`
3. `feat/ref-capture`
4. `feat/web-pixel-conversion`
5. `feat/usage-billing`
6. `feat/dashboard-metrics`
7. `docs/readme-architecture-devops`

## 4) Flujo operativo por cada funcionalidad

1. Actualizar troncal:
   - `git checkout main`
   - `git pull`
2. Crear rama:
   - `git checkout -b feat/nombre-corto`
3. Desarrollar con commits pequenos.
4. Validar local:
   - `npm run lint`
   - `npm run typecheck`
   - prueba manual del flujo impactado
5. Integrar:
   - PR hacia `main` o merge directo controlado si trabajas solo.
6. Limpiar:
   - borrar rama local tras merge.

## 5) Politica de commits (convencion)

Formato recomendado:

- `feat: add affiliate model and unique code per shop`
- `feat: ingest checkout_completed conversion event`
- `feat: create usage record with 5 percent app fee`
- `fix: prevent duplicate billing with idempotency key`
- `docs: add architecture and devops rationale`

## 6) Reglas de calidad para merge a `main`

- Sin errores de lint/typecheck.
- Sin secretos en el repo.
- Cada feature deja evidencia funcional minima (UI o endpoint probado).
- Si toca billing o conversiones, debe incluir idempotencia.
- README actualizado cuando hay decisiones arquitectonicas nuevas.

## 7) Estrategia de releases para demo final

- Mantener tag final al terminar la prueba, por ejemplo `v0.1.0-mvp`.
- Preparar script/demo checklist desde `main`.
- Grabar video usando siempre el estado de `main`.
