import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import { ChakraProvider } from '@chakra-ui/react';
import { SaasProvider } from '@saas-ui/react';

import { AuthProvider } from "./context/AuthContext";

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';


// ======================================================
// REACT QUERY CLIENT
// ======================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
});


// ======================================================
// APP
// ======================================================

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>

      <ChakraProvider>
        <SaasProvider>

          <AuthProvider>
            <App />
          </AuthProvider>

        </SaasProvider>
      </ChakraProvider>

    </QueryClientProvider>
  </React.StrictMode>
);