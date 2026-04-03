// src/components/forms/LoginPassword.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  VStack,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/react'
import api from '../../api/apiClient'

export default function LoginPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const username = (location.state as any)?.username || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) {
      navigate('/')
    }
  }, [username, navigate])

  // helper: ensure CSRF cookie exists (apiClient expose endpoint /csrf/)
  async function ensureCsrfCookie() {
    try {
      await api.get('/api/v1/customers/csrf/', { skipAuth: true })
    } catch {
      // ignore: if it fails, login will likely fail with CSRF error and we will handle it
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Veuillez entrer le mot de passe')
      return
    }

    setLoading(true)
    setError('')

    try {
      // clear old tokens
      localStorage.removeItem('token')
      localStorage.removeItem('refresh')

      // 1) s'assurer que le cookie csrftoken est présent
      await ensureCsrfCookie()

      // 2) POST login (apiClient ajoutera X-CSRFToken si cookie présent)
      const res = await api.post(
        '/api/v1/customers/auth/login/',
        { username, password },
        { skipAuth: true } // skipAuth garde la logique d'auth dans l'interceptor
      )

      // 3) extraire tokens et user
      const access = res.data?.access || res.data?.token || res.data?.data?.access
      const refresh = res.data?.refresh || res.data?.data?.refresh
      const tenant_url = res.data?.tenant_url || res.data?.data?.tenant_url
      const one_time_token = res.data?.one_time_token || res.data?.data?.one_time_token

      if (!access) throw new Error('Token non trouvé dans la réponse du serveur')

      localStorage.setItem('token', access)
      if (refresh) {
        try { localStorage.setItem('refresh', refresh) } catch {}
      }

      // si backend renvoie tenant_url + one_time_token -> redirection vers tenant
      if (tenant_url && one_time_token) {
        // redirection complète pour que le navigateur reçoive le cookie posé par le tenant
        window.location.href = `${tenant_url.replace(/\/$/, '')}/session-establish/?ot=${one_time_token}`
        return
      }

      // sinon récupérer user et naviguer vers dashboard
      let userData = res.data?.user || res.data?.data?.user || null
      if (!userData) {
        const me = await api.get('/api/v1/customers/users/me/')
        userData = me.data
      }
      navigate('/dashboard', { state: { user: userData } })
    } catch (err: any) {
      // si erreur CSRF, tenter une récupération automatique et réessayer une fois
      const msg = err?.response?.data || err?.message || 'Erreur lors de la connexion'
      if (err?.response?.status === 403 && String(msg).toLowerCase().includes('csrf')) {
        try {
          // obtenir cookie CSRF puis réessayer login une seule fois
          await ensureCsrfCookie()
          const retry = await api.post('/api/v1/customers/auth/login/', { username, password }, { skipAuth: true })
          const access = retry.data?.access || retry.data?.token
          if (access) {
            localStorage.setItem('token', access)
            const tenant_url = retry.data?.tenant_url || retry.data?.data?.tenant_url
            const one_time_token = retry.data?.one_time_token || retry.data?.data?.one_time_token
            if (tenant_url && one_time_token) {
              window.location.href = `${tenant_url.replace(/\/$/, '')}/session-establish/?ot=${one_time_token}`
              return
            }
            const me = await api.get('/api/v1/customers/users/me/')
            navigate('/dashboard', { state: { user: me.data } })
            return
          }
        } catch {
          // fallback to show original error
        }
      }

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Erreur lors de la connexion'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!error}>
          <FormLabel>Mot de passe</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="votre_mot_de_passe"
            autoComplete="current-password"
          />
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>

        <Button
          type="submit"
          colorScheme="purple"
          width="full"
          isLoading={loading}
          size="lg"
        >
          Se connecter
        </Button>
      </VStack>
    </form>
  )
}
