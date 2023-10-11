import { useContext } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";
import Contact from "./Contact";
import Logo from "./Logo";

export default function Navigation({onlinePeople,offlinePeople,onClick,selectedUserId,setWs }) {
  const { username,setId, setUsername } = useContext(UserContext);
 
  function logOut() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  return (
    <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {onlinePeople &&
            Object.keys(onlinePeople).map((userId) => (
              <Contact
                key={userId}
                id={userId}
                online
                onClick={onClick}
                selected={userId === selectedUserId}
                username={onlinePeople[userId]}
              />
            ))}
          {offlinePeople &&
            Object.keys(offlinePeople).map((userId) => (
              <Contact
                key={userId}
                id={userId}
                online={false}
                onClick={onClick}
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
  )
}
