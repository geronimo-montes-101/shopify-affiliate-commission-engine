# Proteccion de rama main

Configura estas reglas en GitHub:

1. Ve a **Settings > Branches > Add branch protection rule**.
2. En **Branch name pattern** usa `main`.
3. Activa:
   - Require a pull request before merging
   - Require approvals (1 minimo)
   - Dismiss stale pull request approvals when new commits are pushed
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require conversation resolution before merging
   - Do not allow bypassing the above settings
   - Block force pushes
   - Block branch deletion
4. En **Status checks** agrega:
   - `quality`

Flujo sugerido:

- Trabajar en ramas feature desde `dev`.
- Abrir PR: `feature/*` -> `dev`.
- Cuando `dev` este estable, abrir PR: `dev` -> `main`.
