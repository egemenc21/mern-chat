import { useContext, useEffect, useRef } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";

export default function Messages({messages}) {
  const { id } = useContext(UserContext);
  const divUnderMessages = useRef();


  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) div.scrollTop = div.scrollHeight;
  }, [messages]);

  return (
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
            {message.file && (
              <div className="">
                <a
                  className="flex items-center gap-1 border-b"
                  href={
                    axios.defaults.baseURL +
                    '/uploads/' +
                    message.file
                  }
                  target="_blanc"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                  {message.file}
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={divUnderMessages}></div>
    </div>
  </section>
  )
}
