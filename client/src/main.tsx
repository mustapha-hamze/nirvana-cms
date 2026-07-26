import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeModeProvider } from './components/ui/ThemeModeProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeModeProvider>
        <TooltipProvider>
          <App />
          <Toaster position="top-left" />
        </TooltipProvider>
      </ThemeModeProvider>
    </Provider>
  </StrictMode>,
)
