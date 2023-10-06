import { useContext } from 'react'
import RegisterAndLogIn from './RegisterAndLogIn'
import { UserContext } from './UserContext'
import Chat from './Chat'

export default function Routes() {
  const { username } = useContext(UserContext)

  if (username) return <Chat/>

  return <RegisterAndLogIn />
}
