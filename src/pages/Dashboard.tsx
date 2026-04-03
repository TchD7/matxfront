import { useEffect, useState } from 'react'
import api from '../api/apiClient'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me/')
        setUser(res.data)
      } catch (err) {
        console.error("Erreur récupération utilisateur", err)
      }
    }
    fetchUser()
  }, [])

  if (!user) return <p>Nom d’utilisateur : {user?.username}</p>

  return (
    <div>
      <h1>Bienvenue {user.first_name} {user.last_name}</h1>
      <p>Nom d’utilisateur : {user.username}</p>
      <p>Email : {user.email}</p>
      <p>Client : {user.client}</p>
      <p>Rôle : {user.role}</p>
    </div>
  )
}
