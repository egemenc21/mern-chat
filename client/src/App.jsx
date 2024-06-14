import axios from 'axios'
import UserContextProvider from './components/UserContext'

import Routes from './components/Routes'

function App() {
  axios.defaults.baseURL = 'http://mern-chat-server-drab.vercel.app'
  axios.defaults.withCredentials = true

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}

export default App
