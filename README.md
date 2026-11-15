# FTB Quest Studio (ftb-snbt-editor)

**FTB Quest Studio** es una suite web para diseñar, auditar, simular y exportar modpacks completos de **FTB Quests** (Minecraft 1.20.1+) en formato **SNBT** (Stringified NBT). Corre 100 % en el navegador, sin backend.

Permite abrir varios capítulos a la vez, editarlos de forma visual (mapa) o tabular, validar la integridad del grafo de misiones, simular la progresión de un jugador y exportar todo con la estructura de carpetas de FTB Quests.

---

## Stack

- React 19 + TypeScript 6 + Vite 8
- Canvas: `konva` / `react-konva`
- `jszip` (exportación ZIP), `adm-zip` (script de texturas), `lucide-react` (iconos), `uuid`
- Lint: `oxlint`
- Despliegue automático en **GitHub Pages** (`.github/workflows/deploy.yml`, al hacer push a `main`)

---

## ✨ Funcionalidades

### Edición en el lienzo (mapa)
- Zoom, paneo (herramienta mano o `Espacio`), selección por recuadro y selección múltiple.
- Arrastrar misiones e imágenes con **snap a rejilla** (relativo/absoluto) y **smart snapping** con guías magnéticas.
- Alineación (izquierda, centro, derecha, arriba, medio, abajo) y distribución.
- Duplicar, bloquear/desbloquear elementos, capas visibles (misiones, imágenes, dependencias) y filtro por nivel Z.
- Formas de misión estilo FTB (círculo, engranaje, polígonos…), líneas de conexión bezier / rectas / ortogonales.
- **Minimapa**, **búsqueda y reemplazo masivo** (`Ctrl+F` / `Ctrl+H`) y menú contextual.
- Rendimiento: frustum culling, modo eco y calidad de textura adaptable.

### Pestañas de capítulos
- Abre varios `.snbt` a la vez (botón o arrastrar y soltar). Cada pestaña conserva su propio historial, selección, cámara y estado “modificado”.
- Capítulos nuevos en blanco, cierre de pestañas y navegación con `Ctrl+Tab` / `Ctrl+W`.
- Panel lateral de propiedades redimensionable y colapsable.

### Vista de tabla
- Edición de misiones, tareas y recompensas en forma de tabla.
- Selección múltiple, **edición por lote**, ordenación, paginación y **exportación a CSV**.

### Misiones, tareas y recompensas
- IDs hexadecimales únicos de 16 caracteres.
- Gestor completo de tareas y recompensas ([QuestTaskRewardManager](src/components/QuestTaskRewardManager.tsx)).
- Editor de texto Minecraft con códigos `&` / `&#RRGGBB`, paleta, formatos y vista previa en vivo.
- Edición **NBT/SNBT raw** de cualquier misión.
- Selector de iconos/texturas y selector de **etiquetas de ítem** (`#forge:...`).
- **Dependencias**: crear, invertir, borrar y dependencias **entre capítulos**; validación de ciclos y dependencias rotas.
- **Auto-layout** (Sugiyama, horizontal o vertical), también sobre la selección.

### Imágenes decorativas
- Posición, tamaño, rotación, opacidad, tinte de color y orden de capa.

### Historial, portapapeles y atajos
`Ctrl+Z` deshacer · `Ctrl+Y` / `Ctrl+Shift+Z` rehacer · `Ctrl+C` / `Ctrl+V` copiar/pegar · `Ctrl+D` duplicar · `Ctrl+W` cerrar pestaña · `Ctrl+Tab` cambiar pestaña · `Supr` borrar dependencia seleccionada.

### Herramientas de modpack
- **Reward Tables y Loot Crates**: editor visual, importación `.snbt` y exportación.
- **Grupos de capítulos**: edición y descarga de `chapter_groups.snbt`.
- **Blueprints y prefabs**: plantillas prehechas (Progresión por Tiers, Boss Rush, Checklist inicial), guardado de selecciones como plantilla propia y cajón de prefabs anclados.
- **Traducciones (i18n)**: convierte textos a claves `{clave}` y exporta/importa `en_us.json` y `es_es.json`.
- **Analytics**: reparto por capítulo y grupo, economía (XP, tareas, recompensas), cuellos de botella y misiones huérfanas.
- **Modpack Doctor**: auditoría de integridad (tareas/recompensas inválidas, tablas rotas, dependencias rotas, textos faltantes…) con puntuación de salud y auto-reparación.
- **Simulador de progresión** y **Modo Jugador**: desbloqueo por dependencias, inventario virtual, XP y tablas de loot.
- **Generador de comandos**: `/ftbquests change_progress <jugador> <acción> <id>`, `/give` de los ítems requeridos y scripts KubeJS de prueba.

### Importación y exportación
- Importar: uno o varios `.snbt` de capítulos (típicamente `config/ftbquests/quests/chapters/`).
- Exportar: capítulo actual, todos los capítulos, o un **ZIP** con la estructura  
  `config/ftbquests/quests/{chapters, reward_tables}/` más `chapter_groups.snbt`.

### Persistencia
Los capítulos viven solo en memoria hasta que los exportas. Se guardan en `localStorage`: reward tables, grupos de capítulos, prefabs anclados, ancho del panel lateral y estilo de líneas.

---

## 🎨 Texturas de Minecraft

El editor lee las texturas desde `public/textures/` y un índice `textures-index.json`. Si no se encuentra una textura se muestra un círculo gris de reserva.

> ⚠️ El repositorio actualmente **incluye** `public/textures` (≈29 000 PNG, ~81 MB de Vanilla y mods). Las texturas pertenecen a Mojang y a los autores de cada mod; considera ignorarlas en `.gitignore` (hay una línea `#public/textures/` comentada) y generarlas localmente.

### Regenerarlas con el extractor
```bash
npm install
npm run extract-textures
```
El script pregunta (ambas opcionales):
1. Ruta de la carpeta `mods` de tu instancia (analiza todos los `.jar`).
2. Ruta del `.jar` Vanilla (p. ej. `.minecraft/versions/1.20.1/1.20.1.jar`).

Extrae `assets/<namespace>/textures/{item,block}/**/*.png` a `public/textures/` y regenera `textures-index.json`.

---

## 🛠️ Desarrollo

Requisitos: Node.js 18+ (CI usa 20) y npm.

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview   # previsualizar el build
```

`vite.config.ts` define `base: '/ftbquest-studio/'`, por lo que en local la app se sirve en `http://localhost:5173/ftbquest-studio/`.

---

## 📖 Uso rápido

1. Pulsa **Cargar SNBT** o arrastra uno o varios `.snbt` a la ventana.
2. Edita en **Mapa** o **Tabla**; el panel derecho muestra las propiedades de la selección.
3. Revisa el **Doctor**, **Analytics** y el **Simulador**.
4. Exporta con **Exportar** (capítulo), **Exportar todo** o **ZIP** y copia el resultado a la carpeta de tu modpack.

---

## 📂 Estructura del código

```
├── .github/workflows/deploy.yml   # Despliegue a GitHub Pages
├── scripts/extract-textures.js    # Extrae texturas de .jar y genera textures-index.json
├── public/textures/               # Texturas extraídas + textures-index.json
└── src/
    ├── App.tsx                    # Estado global: pestañas, historial, portapapeles, atajos, paneles, import/export
    ├── components/
    │   ├── EditorCanvas.tsx       # Lienzo react-konva (culling, snapping, conexiones)
    │   ├── TableView.tsx          # Vista de tabla + edición por lote (TableBatchModal)
    │   ├── QuestTaskRewardManager.tsx, QuestShape.tsx, Minimap.tsx, QuestSearchBar.tsx, ChapterTabBar.tsx
    │   ├── MinecraftTextEditorModal / MinecraftTextToolbar / MinecraftFormattedPreview
    │   ├── TexturePickerModal, ItemTagPickerModal
    │   ├── RewardTableModal, ChapterGroupModal, CrossChapterDependencyModal
    │   ├── BlueprintLibraryModal, PinnedPrefabsModal, TranslationManagerModal
    │   └── AnalyticsDashboardModal, ModpackDoctorModal, QuestSimulatorModal, CommandGeneratorModal
    ├── types/                     # chapter, chapterGroup, rewardTable, blueprints, i18n, analytics
    └── utils/
        ├── snbt.ts                # Parser y serializador SNBT propios
        ├── autoLayout.ts, smartSnapping.ts, graphValidation.ts
        ├── blueprintEngine.ts, i18nManager.ts, zipExporter.ts
        ├── modpackDoctor.ts, questAnalytics.ts, questSimulatorEngine.ts, commandGenerator.ts
        └── textureHelper.tsx, isometricBlockRenderer.tsx, minecraftText.tsx, minecraftCatalogs.ts, itemTagCatalogs.ts
```

### Notas técnicas
- `snbt.ts` representa los números como `{ __type: 'number', value, suffix }` para conservar sufijos (`b`, `d`, `f`, `L`). Las claves que empiezan por `_` son internas y no se exportan. El parser es tolerante y no valida; no conserva comentarios.
- No hay suite de tests automatizados.
