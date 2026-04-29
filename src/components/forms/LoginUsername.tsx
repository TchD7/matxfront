import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  VStack, 
  Input, 
  Button, 
  FormControl, 
  FormLabel, 
  FormErrorMessage,
  Checkbox, 
  Text
} from '@chakra-ui/react'
import api from '../../api/apiClient'

// ============================================================
// Extraction des messages d'erreur depuis le backend
// Respecte le contrat API strictement
// ============================================================
function extractErrorMessage(error: any): string {
  const data = error?.response?.data;

  if (!data) return "Erreur serveur";

  // Priorité 1: data.detail (erreur globale)
  if (data.detail) return data.detail;

  // Priorité 2: premier champ erreur (erreur par champ)
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];

  if (Array.isArray(firstValue)) return firstValue[0];

  return firstValue || "Erreur inconnue";
}

export default function LoginUsername() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false) 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanUsername = username.trim()

    if (!cleanUsername) {
      setError("Le nom d'utilisateur est requis")
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/api/v1/customers/users/check-credentials/', {
        credential: cleanUsername
      })

      // ✅ stockage sécurisé temporaire
      sessionStorage.setItem('login_username', cleanUsername)
      sessionStorage.setItem('keep_signed_in', String(keepSignedIn))

      // ✅ navigation robuste
      navigate(`/login-password?username=${encodeURIComponent(cleanUsername)}`)

    } catch (err: any) {
      console.error('❌ Erreur lors de la vérification des identifiants:', err);
      
      // ✅ Utiliser extractErrorMessage pour respecter le contrat API
      // Cela respecte la priorité: detail > premier champ erreur > fallback
      const errorMsg = extractErrorMessage(err);
      
      setError(errorMsg);
      console.error('💾 Message d\'erreur du backend:', errorMsg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <VStack spacing={5} align="stretch">

        <FormControl isInvalid={!!error}>
          <FormLabel>Nom d'utilisateur</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            size="lg"
          />
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>

        <Checkbox
          isChecked={keepSignedIn}
          onChange={(e) => setKeepSignedIn(e.target.checked)}
        >
          <Text fontSize="sm">Keep me signed in</Text>
        </Checkbox>

        <Button type="submit" isLoading={loading} colorScheme="purple" size="lg">
          Continuer
        </Button>

      </VStack>
    </form>
  )
}