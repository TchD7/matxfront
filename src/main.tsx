import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ChakraProvider } from '@chakra-ui/react'
import { SaasProvider } from '@saas-ui/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <SaasProvider>
        <App />
      </SaasProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
