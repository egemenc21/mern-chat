import { useState, useEffect, useContext, useRef } from 'react';
import Logo from './Logo';
import { UserContext } from './UserContext';
import axios from 'axios';
import Contact from './Contact';

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const divUnderMessages = useRef();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.close();
    };
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function sendMessage(e) {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessage,
      })
    );
    setNewMessage('');
    setMessages((prev) => [
      ...prev,
      {
        sender: id,
        recipient: selectedUserId,
        text: newMessage,
        _id: Date.now(),
      },
    ]);
  }

  function logOut() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages]);

  useEffect(() => {
    console.log({ onlinePeople });
    axios.get('/people').then((res) => {
      const offlinePeopleArray = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArray.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      console.log({ offlinePeople });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  return (
    <div className="flex h-screen ">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {onlinePeopleExclOurUser &&
            Object.keys(onlinePeopleExclOurUser).map((userId) => (
              <Contact
                key={userId}
                id={userId}
                online
                onClick={setSelectedUserId}
                selected={userId === selectedUserId}
                username={onlinePeopleExclOurUser[userId]}
              />
            ))}
          {offlinePeople &&
            Object.keys(offlinePeople).map((userId) => (
              <Contact
                key={userId}
                id={userId}
                online={false}
                onClick={setSelectedUserId}
                selected={userId === selectedUserId}
                username={offlinePeople[userId].username}
              />
            ))}
        </div>
        <div className="p-4 mb-4 flex items-center ">
          <span className="flex items-center pr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={logOut}
            className="text-sm bg-blue-100 px-3 py-2 rounded-md text-gray-500"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow mb-4">
          {!selectedUserId && (
            <div className="h-full flex items-center justify-center">
              <span className="text-gray-600 text-xl tracking-wider">
                &larr; Please select a person
              </span>
            </div>
          )}
          {!!selectedUserId && (
            <section className="relative h-full">
              <div
                ref={divUnderMessages}
                className="absolute overflow-y-scroll inset-0"
              >
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={message.sender === id ? 'text-right' : ''}
                  >
                    <div
                      className={`inline-block text-left p-2 my-2 rounded-md text-sm ${
                        message.sender === id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-500'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </section>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-white flex-grow rounded-md border p-2 "
              placeholder="Type your message here"
            />
            <button type='button' className='bg-gray-500 rounded-md p-2 text-gray-100'>
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
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </button>
            <button
              type="submit"
              className="bg-blue-500 rounded-md p-2 text-white"
            >
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
        )}
      </div>
    </div>
  );
}
