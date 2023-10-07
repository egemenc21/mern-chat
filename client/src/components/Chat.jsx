import { useState, useEffect, useContext } from 'react'
import Avatar from './Avatar'
import Logo from './Logo'
import { UserContext } from './UserContext'

export default function Chat() {
  const [ws, setWs] = useState(null)
  const [onlinePeople, setOnlinePeople] = useState({})
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const { username, id } = useContext(UserContext)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000')
    setWs(ws)
    ws.addEventListener('message', handleMessage)
    return () => {
      ws.removeEventListener('message', handleMessage)
      ws.close()
    }
  }, [])

  function showOnlinePeople(peopleArray) {
    const people = {}
    console.log(peopleArray)
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username
    })
    setOnlinePeople(people)
  }

  function handleMessage(e) {
    const messageData = JSON.parse(e.data)
    if ('online' in messageData) {
      showOnlinePeople(messageData.online)
    }
  }

  const onlinePeopleExclOurUser = { ...onlinePeople }
  delete onlinePeopleExclOurUser[id]

  return (
    <div className="flex h-screen ">
      <div className="bg-white w-1/3 ">
        <Logo />
        {username}
        {Object.keys(onlinePeopleExclOurUser).map((userId, index) => (
          <div
            onClick={() => setSelectedUserId(userId)}
            key={index}
            className={`border-b border-gray-300 flex items-center gap-2 cursor-pointer 
            ${userId === selectedUserId ? 'bg-blue-100' : ''}`}
          >
            {userId === selectedUserId && (
              <div className="w-1 bg-blue-500 h-14"></div>
            )}
            <div className="flex gap-2 items-center py-2 pl-4">
              <Avatar username={onlinePeople[userId]} userId={userId} />
              <span className="text-gray-800">{onlinePeople[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="h-full flex items-center justify-center">
              <span className='text-gray-600'>&larr; Please select a person</span>
            </div>
          )}
        </div>
        <form className="flex gap-2" onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e)=> setNewMessage(e.target.value)}
            className="bg-white flex-grow rounded-md border p-2 "
            placeholder="Type your message here"
          />
          <button type='submit' className="bg-blue-500 rounded-md p-2 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
