import Avatar from './Avatar';

export default function Contact({ onClick, id, selected, username, online }) {
  return (
    <div
      onClick={() => onClick(id)}
      className={`border-b border-gray-300 flex items-center gap-2 cursor-pointer 
            ${selected ? 'bg-blue-100' : ''}`}
    >
      {selected && <div className="w-1 bg-blue-500 h-14"></div>}
      <div className="flex gap-2 items-center py-2 pl-4">
        <Avatar online={online} username={username} userId={id} />
        <span className="text-gray-800">{username}</span>
      </div>
    </div>
  );
}
