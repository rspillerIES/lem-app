# LEM App Frontend

React + TypeScript + Vite + Tailwind CSS application for daily labor, equipment, and material tracking.

## Quick Start

### Install Dependencies
```bash
npm install
```

### Set Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### Start Development Server
```bash
npm run dev
```

App runs on `http://localhost:3000`

### Build for Production
```bash
npm run build
```

Generates optimized files in `dist/` folder.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── FormInput.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── context/             # State management (Zustand)
│   │   └── AuthContext.ts
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── index.ts
│   ├── services/            # API client
│   │   └── api.ts
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── package.json
└── README.md
```

---

## Key Files

### App Structure

**src/App.tsx**
- React Router setup
- Protected routes (authentication)
- Route configuration

**src/context/AuthContext.ts**
- Zustand store for auth state
- Token/user management
- localStorage persistence

**src/services/api.ts**
- Axios HTTP client
- All backend API calls
- Request/response interceptors
- Auth token management

### Pages

**LoginPage**
- Email/password login form
- Token storage
- Redirect to projects on success

**ProjectsPage**
- List all accessible projects
- Search/filter
- Quick actions

**ProjectDetailPage**
- Project overview
- Tabs: Overview, Entries, Budget, Activity
- Navigation hub

### Components

**Button** - Multiple variants (primary, secondary, danger, outline)  
**FormInput** - Text input with validation  
**Select** - Dropdown with options  
**Card** - Content container  

---

## API Integration

All API calls go through `src/services/api.ts`:

```typescript
// Example: Get projects
const response = await api.getProjects();

// Example: Save time entry
await api.saveTimeEntry(projectId, {
  date_of_work: '2026-04-27',
  employee_id: 'emp-123',
  cost_code_id: 'LABOUR',
  regular_hours: 8,
  overtime_hours: 0,
  travel_hours: 0.5,
});

// Example: Get budget
const budget = await api.getProjectBudget(projectId);
```

Auth token is automatically included in all requests.

---

## State Management

Using **Zustand** for global auth state:

```typescript
import { useAuth } from './context/AuthContext';

// Inside component
const token = useAuth((state) => state.token);
const user = useAuth((state) => state.user);
const { setAuth, clearAuth } = useAuth((state) => ({
  setAuth: state.setAuth,
  clearAuth: state.clearAuth,
}));
```

---

## Styling

Using **Tailwind CSS** with custom theme colors:

```typescript
// Primary blue
bg-blue-600, text-blue-600, border-blue-600

// Secondary gray
bg-gray-200, text-gray-600

// Utilities
p-4, m-2, flex, grid, etc.
```

---

## Development Commands

```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Features Implemented

✅ Login/authentication  
✅ Protected routes  
✅ Projects list  
✅ Project detail view  
✅ API client integration  
✅ Responsive design  
✅ TypeScript types  

---

## Features Coming Next

🔄 Daily entry forms (time, equipment, material)  
🔄 Budget dashboard with three-tier view  
🔄 Activity log  
🔄 Export (Jonas CSV, PDF)  
🔄 Project setup wizard  
🔄 Admin screens  

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance

- Vite for fast HMR
- Code splitting by route
- Lazy loading components
- Minified/optimized on build

---

## Troubleshooting

**Port 3000 already in use?**
```bash
# Use different port
npm run dev -- --port 3001
```

**API connection failed?**
- Check VITE_API_URL in .env
- Verify backend is running on correct port
- Check browser console for CORS errors

**Styles not loading?**
```bash
# Rebuild Tailwind
npm run build
```

---

## Deployment

**To Vercel:**
```bash
vercel
```

**To other host:**
```bash
npm run build
# Deploy dist/ folder
```

Set environment variable on host:
```
VITE_API_URL=https://api.production.com
```

---

## License

MIT
