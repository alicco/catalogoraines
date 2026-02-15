# CLAUDE.md — AI Assistant Guide for Catalogoraines (AISAC v2)

## Project Overview

**Catalogoraines** (package name: `aisac-v2`) is a product catalog and kit management system for Raines, a medical/safety equipment company. Users can browse products, build custom catalogs via drag-and-drop, save/share catalogs, view them as interactive 3D flipbooks, and export to PDF. The primary UI language is Italian.

## Tech Stack

- **Framework:** React 19 with JSX (not TypeScript)
- **Bundler:** Vite 7
- **State Management:** Zustand 5 with localStorage persistence
- **Styling:** Tailwind CSS 4 + Material UI (MUI) 7 + Emotion
- **Drag & Drop:** react-dnd with multi-backend (HTML5 + Touch)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation:** @react-pdf/renderer, jspdf, html2canvas
- **3D/Flipbook:** react-pageflip, three.js
- **Icons:** Lucide React, MUI Icons
- **Package Manager:** npm
- **Module System:** ES Modules (`"type": "module"`)

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint (flat config, JS/JSX only)
```

There are no test commands — no test framework is configured.

## Project Structure

```
src/
├── components/           # React UI components (~20 files)
│   ├── App.jsx           # (actually at src/App.jsx) Main app, routing, DnD provider
│   ├── CatalogBuilder.jsx  # Drop zone for building catalogs
│   ├── Warehouse.jsx       # Product browsing/search interface
│   ├── DraggableItem.jsx   # Product card (draggable)
│   ├── Header.jsx          # Navigation bar
│   ├── TotalPanel.jsx      # Catalog summary, save/export actions
│   ├── ProductManager.jsx  # Admin: product CRUD table
│   ├── ProductEditor.jsx   # Admin: product form modal
│   ├── QuoteManager.jsx    # Saved catalogs/quotes management
│   ├── FlipbookCatalog2.jsx # Primary 3D flipbook viewer (spread layout)
│   ├── FlipbookCatalog.jsx  # Flipbook viewer (original)
│   ├── FlipbookCatalog3D.jsx # Alternate 3D viewer
│   ├── KitPDF.jsx          # PDF export wrapper
│   ├── KitPDFDocument.jsx  # PDF generation logic
│   ├── Toast.jsx           # Notification component
│   ├── SavedKitsModal.jsx  # Kit selection modal
│   ├── Dashboard.jsx       # Admin dashboard
│   ├── RainesLogo.jsx      # SVG logo component
│   └── ErrorBoundary.jsx   # React error boundary
├── lib/
│   ├── store.js            # Zustand store (central state, DB actions, ~436 LOC)
│   ├── supabaseClient.js   # Supabase client initialization
│   ├── firebase.js         # Firebase config (template/unused)
│   ├── firebaseService.js  # Firestore service (partially integrated)
│   └── utils.js            # Utility functions
├── data/
│   └── products.js         # Local product data fallback
├── assets/                 # Static assets (SVGs)
├── App.jsx                 # Root component with DnD provider and view routing
├── main.jsx                # React DOM entry point
├── index.css               # Tailwind directives + custom global styles
└── App.css                 # Additional component styles

scripts/                    # Node.js data migration & utility scripts
public/                     # Static files, product images, standalone HTML tools
```

## Architecture & Key Patterns

### State Management (Zustand)
All app state lives in `src/lib/store.js` via a single Zustand store:
- **Inventory state:** `inventory`, `categories`, `loading`
- **Catalog builder state:** `catalogItems`, `catalogDiscount`, `catalogExpirationDate`
- **View state:** `currentView` controls which page renders (`kit`, `product-manager`, `quote-manager`, `flipbook-catalog`)
- **Auth state:** `user` (Supabase auth, not currently enforced)
- **Persistence:** localStorage key `'raines-inventory-v3'` caches products for offline access
- **URL sharing:** Catalog item IDs encoded as base64 in `?k=` query parameter

Access pattern:
```jsx
import useStore from './lib/store';
const inventory = useStore((state) => state.inventory);
// or outside React:
useStore.getState().addToCatalog(item);
```

### Data Flow
1. Products fetched from Supabase `catalogo` table on mount (`fetchCatalog`)
2. DB fields normalized to app model (e.g., `codice_articolo` → `id`, `descrizione` → `name`, `costo` → `price`)
3. Products cached in localStorage
4. User drags products from Warehouse → CatalogBuilder
5. Catalogs saved to Supabase `saved_kits` table or exported as PDF

### View Routing
No router library — `currentView` state in Zustand determines which component renders in `App.jsx`. Views: `kit` (default), `product-manager`, `quote-manager`, `flipbook-catalog`.

### Drag & Drop
- Uses `react-dnd` with `MultiBackend` (HTML5 for desktop, Touch for mobile)
- Item types: `PRODUCT` (single item) and `CATEGORY` (bulk add)
- `CustomDragLayer` provides visual preview on touch devices
- Drop target: `CatalogBuilder` component

### Component Communication
- **Zustand store:** Primary communication channel
- **Custom DOM events:** `'new-product'` and `'edit-product'` events trigger `ProductEditor` modal
- **Props:** Callbacks like `onDrop`, `onClose` passed to children

## Database Schema (Supabase)

### `catalogo` table (products)
| DB Column | App Field | Description |
|-----------|-----------|-------------|
| `codice_articolo` | `id` | Product code (primary identifier) |
| `id` | `_dbId` | Numeric DB auto-increment ID |
| `descrizione` | `name` | Product name |
| `costo` | `price` | Unit price |
| `categoria` | `category` | Product category |
| `link_immagine` | `image` | Image URL |
| `specifiche` | `specifiche` | Specifications |
| `descrizione_estesa` | `descrizione_estesa` | Extended description |
| `formato_cartone` | `formato_cartone` | Box format |
| `unita_vendita` | `unita_vendita` | Sales unit |
| `iva` | `iva` | VAT rate |
| `costo_al_metro` | `costo_al_metro` | Per-meter cost |

### `saved_kits` table
Fields: `id`, `name`, `items` (JSON), `total_price`, `discount`, `expiration_date`, `created_at`, `updated_at`

## Code Conventions

### Naming
- **Components:** PascalCase files and exports (`CatalogBuilder.jsx`)
- **Functions/variables:** camelCase (`fetchCatalog`, `catalogItems`)
- **Constants:** UPPER_SNAKE_CASE (`COLORS`, `DECO_FILLS`)
- **CSS classes:** Tailwind utilities; custom classes use descriptive prefixes (`btn-skeuo`, `panel-inset`)

### File Patterns
- All source files use `.jsx` extension (not `.tsx`)
- Components export named functions: `export function ComponentName() {}`
- Store is a default export: `export default useStore`
- ES module imports throughout (`import`/`export`)

### Styling
- **Primary:** Tailwind CSS utility classes inline
- **Custom styles:** `src/index.css` for global overrides and custom component classes
- **MUI components:** Used for admin interfaces (DataGrid, Dialogs, Buttons)
- **Theme colors:** Defined in `tailwind.config.js` — `darkBlue`, `teal`, `lightBlueBg`, `statusGreen/Yellow/Red`, `kitCyan`
- **Font:** Inter (sans-serif)
- **Responsive:** Mobile-first with `sm:`, `md:`, `lg:` breakpoints

### Error Handling
- `ErrorBoundary` wraps all views for crash recovery
- Async operations use try/catch with `console.error`
- User notifications via `Toast` component

## ESLint Configuration

Flat config format (`eslint.config.js`):
- Extends: `@eslint/js` recommended, `react-hooks`, `react-refresh`
- Custom rule: `no-unused-vars` ignores uppercase/underscore-prefixed names (`varsIgnorePattern: '^[A-Z_]'`)
- Ignores: `dist/` directory
- ECMAScript 2020, browser globals, JSX enabled

## Environment Variables

Required variables (prefix with `VITE_` for client access):
```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anonymous/public key
```

Note: The Supabase client currently has credentials hardcoded in `src/lib/supabaseClient.js` for deployment stability. The `.env` file and `.env.example` also exist.

## Deployment

- Targets **Vercel** (`.vercel` in `.gitignore`)
- Build output: `dist/` directory
- No CI/CD pipeline configured
- No automated tests

## Important Notes for AI Assistants

1. **Language:** UI text is in Italian (e.g., "Catalogo caricato!", "descrizione", "costo"). Maintain Italian for user-facing strings.
2. **No TypeScript:** The project uses plain JSX. Do not introduce `.ts`/`.tsx` files.
3. **No tests:** There is no test framework. If adding tests, this would need to be set up from scratch.
4. **Firebase is unused:** `firebase.js` and `firebaseService.js` exist but are template/placeholder code. The active backend is Supabase.
5. **Multiple flipbook implementations:** `FlipbookCatalog2.jsx` is the primary one used in `App.jsx`. The others (`FlipbookCatalog.jsx`, `FlipbookCatalog3D.jsx`) are alternatives/experiments.
6. **Data normalization:** Always map between Supabase column names and app field names when working with the store. See the mapping table above.
7. **Image URLs:** Product images use timestamp cache-busting (`?v=${timestamp}`).
8. **Admin mode:** `isAdminMode` flag in the store controls visibility of admin features (defaults to `true`).
9. **Scripts directory:** Contains Node.js utility scripts for data migration, image processing, and DB syncing — these are run manually, not part of the build.
