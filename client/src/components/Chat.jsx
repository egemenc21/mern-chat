import { useState, useEffect, useContext } from 'react';
import { UserContext } from './UserContext';
import axios from 'axios';
import ChatBox from './ChatBox';
import Messages from './Messages';
import Navigation from './Navigation';
import NoUserSelected from './NoUserSelected';

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { id } = useContext(UserContext);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.close();
    };
  }, []);

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

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function sendMessage(e, file = null) {
    if (e) e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessage,
        file,
      })
    );
    if (file) {
      axios.get('/messages/' + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    } else {
      setNewMessage('');
      setMessages((prev) => [
        ...prev,
        {
          text: newMessage,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  }

  function sendFile(e) {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: e.target.files[0].name,
        data: reader.result,
      });
    };
  }

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  return (
    <div className="flex h-screen ">
      <Navigation
        onlinePeople={onlinePeopleExclOurUser}
        offlinePeople={offlinePeople}
        onClick={setSelectedUserId}
        selectedUserId={selectedUserId}
        setWs={setWs}
      />

      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow mb-4">
          {!selectedUserId && <NoUserSelected />}
          {!!selectedUserId && <Messages messages={messages} />}
        </div>
        {!!selectedUserId && (
          <ChatBox
            onChange={setNewMessage}
            onSubmit={sendMessage}
            value={newMessage}
            fileOnChange={sendFile}
          />
        )}
      </div>
    </div>
  );
}
