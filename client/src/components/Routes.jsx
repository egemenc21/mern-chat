import { useContext } from 'react'
import RegisterAndLogIn from './RegisterAndLogIn'
import { UserContext } from './UserContext'

export default function Routes() {
  const { username, id } = useContext(UserContext)
  console.log(username, id)

  if (username) return 'logged in --- ' + username

  return <RegisterAndLogIn />
}
