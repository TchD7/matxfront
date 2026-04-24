import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ChakraProvider } from '@chakra-ui/react'
import { SaasProvider } from '@saas-ui/react'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <SaasProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SaasProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
