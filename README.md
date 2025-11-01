# Spend-O-Meter React

A modern React + TypeScript migration of the Spend-O-Meter financial calculator application.

## Features

- 💰 **Finance Calculator** - Track your money, payments, and daily spending budget
- 🛒 **Product Comparison** - Compare products by price per unit
- ⛽ **Fuel Station Comparison** - Compare gas stations with different discount types
- 🌓 **Dark/Light Theme** - Toggle between themes with localStorage persistence
- 🌐 **i18n Support** - Russian and English language support
- 📊 **Charts** - Visual representation of expenses using Chart.js
- 💾 **LocalStorage** - All data persists across sessions

## Tech Stack

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Chart.js + react-chartjs-2** - Data visualization
- **Context API** - State management for theme and language
- **CSS** - Clean, maintainable styling

## Project Structure

```
src/
├── components/         # React components
│   ├── Header.tsx             # Navigation and controls
│   ├── FinanceCalculator.tsx  # Finance calculator tool
│   ├── ProductComparison.tsx  # Product comparison tool
│   └── FuelComparison.tsx     # Fuel station comparison tool
├── contexts/          # React contexts
│   ├── ThemeContext.tsx       # Dark/light theme management
│   └── LanguageContext.tsx    # i18n management
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── translations.ts        # Translation strings
├── App.tsx            # Main application component
├── App.css            # Global styles
└── main.tsx           # Application entry point
```

## Best Practices Implemented

### Architecture
- ✅ **Component-based architecture** - Modular, reusable components
- ✅ **Context API** - Efficient state management for global state (theme, language)
- ✅ **Custom hooks** - Encapsulated logic in `useTheme` and `useLanguage`
- ✅ **TypeScript** - Full type safety throughout the application

### Code Quality
- ✅ **Separation of concerns** - Logic, presentation, and state separated
- ✅ **DRY principle** - Reusable components and utilities
- ✅ **Type safety** - Proper TypeScript types and interfaces
- ✅ **Clean imports** - Using `type` keyword for type-only imports

### Performance
- ✅ **LocalStorage caching** - Persistent data without backend
- ✅ **Conditional rendering** - Only active tools are rendered
- ✅ **Optimized builds** - Vite's fast HMR and optimized production builds

### User Experience
- ✅ **Theme persistence** - User preferences saved
- ✅ **Responsive design** - Mobile-friendly layouts
- ✅ **Accessibility** - Semantic HTML and proper labels

## Development

### Prerequisites
- Node.js 16+ and npm

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Migration Notes

This project was migrated from a single vanilla HTML/JS file to a modern React application:

### What Changed
- ✅ Vanilla JavaScript → React + TypeScript
- ✅ Inline scripts → Component-based architecture
- ✅ Manual DOM manipulation → Declarative React rendering
- ✅ Global state → Context API
- ✅ No build process → Vite build system
- ✅ No type checking → Full TypeScript support

### What Stayed the Same
- ✅ All original functionality preserved
- ✅ Same visual design and UX
- ✅ LocalStorage persistence
- ✅ Theme and language switching
- ✅ All calculations and comparison logic

## License

© 2025 Spend-O-Meter
