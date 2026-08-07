import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeModeProvider } from './components/ui/ThemeModeProvider'
import { LocaleProvider } from './i18n/LocaleProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeModeProvider>
        <LocaleProvider>
          <TooltipProvider>
            <App />
            <Toaster position="top-left" />
          </TooltipProvider>
        </LocaleProvider>
      </ThemeModeProvider>
    </Provider>
  </StrictMode>,
)
