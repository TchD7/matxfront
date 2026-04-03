import { useState } from 'react'
import { 
  VStack, 
  Input, 
  Button, 
  FormControl, 
  FormLabel, 
  FormErrorMessage,
  Checkbox, // <-- Nouvel import
  Text
} from '@chakra-ui/react'
import api from '../../api/apiClient'

interface Props {
  onNext: (username: string) => void
}

export default function LoginUsername({ onNext }: Props) {
  const [username, setUsername] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false) // <-- État pour la checkbox
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError("Le nom d'utilisateur est requis")
      return
    }

    setLoading(true)
    setError('')
    try {
      // Tu peux aussi envoyer keepSignedIn à ton API si nécessaire
      await api.post(
        '/api/v1/customers/users/check-credentials/',
        { credential: username.trim() },
        { skipAuth: true }
      )
      
      // On passe l'info au parent si besoin
      onNext(username.trim())
    } catch (err: any) {
      setError("Utilisateur non trouvé")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <VStack spacing={5} align="stretch">
        <FormControl isInvalid={!!error}>
          <FormLabel fontSize="sm" fontWeight="medium">Nom d'utilisateur</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            //placeholder="Ex: jean_matx"
            focusBorderColor="purple.500"
            size="lg"
            rounded="md"
          />
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>

        {/* --- CHECKBOX CHAKRA UI --- */}
        <Checkbox 
          colorScheme="purple" 
          size="md"
          isChecked={keepSignedIn}
          onChange={(e) => setKeepSignedIn(e.target.checked)}
        >
          <Text fontSize="sm" color="gray.600">
            Keep me signed in
          </Text>
        </Checkbox>
        {/* --------------------------- */}

        <Button
          type="submit"
          colorScheme="purple"
          isLoading={loading}
          size="lg"
          w="full"
          boxShadow="md"
          _hover={{ boxShadow: 'lg' }}
        >
          Continuer
        </Button>
      </VStack>
    </form>
  )
}