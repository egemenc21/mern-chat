import { useContext, useState } from 'react'
import axios from 'axios'
import { UserContext } from './UserContext'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')

  const url = isLoginOrRegister === 'register' ? 'register' : 'login'

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data } = await axios.post(url, { username, password })
    setLoggedInUsername(username)
    setId(data.id)
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <button
          type="submit"
          className="bg-blue-500 rounded-sm block text-white w-full p-2"
        >
          {isLoginOrRegister === 'register' ? 'Register' : 'Log in'}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?
              <button
                type="button"
                href=""
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
            <div>
              Already a member?{' '}
              <button
                type="button"
                href=""
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
