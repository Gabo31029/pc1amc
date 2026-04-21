## Sistema de Postulaciones (React)

### Requisitos
- Node.js (recomendado 18+)

### Instalar y ejecutar

```bash
cd "C:\Users\USER\Desktop\Shifu\universidad\5to ciclo\AMC\sistema-postulaciones"
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:5173/`

### Qué incluye
- **UI moderna** (estilo sobrio tipo producto), layout con header + breadcrumb + navegación.
- **4 casos de uso implementados**:
  - Registrar ficha de postulación (borrador / enviar, validaciones, documentos dinámicos).
  - Seguimiento de postulaciones (filtros, tabla paginada 10 por página, **exportación a Excel**).
  - Actualizar ficha para asociación (parte de ficha base, PDF, **versionado**, bloqueo si contrato firmado).
  - Actualizar ficha para adjudicación (solo adjudicados, documentos, versionado, bloqueo si convenio formalizado).
- **Persistencia sin backend**: datos en `localStorage` (seed automático la primera vez).

### Notas
- La carga de documentos se simula guardando **metadatos** del archivo (nombre/tamaño/tipo) para demostrar validación y trazabilidad.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
