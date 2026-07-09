import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastProvider } from './components/ui/ToastProvider'
import { ThemeModeProvider } from './components/ui/ThemeModeProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeModeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeModeProvider>
    </Provider>
  </StrictMode>,
)
