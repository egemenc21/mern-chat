export default function Avatar({ userId, username, online }) {
  const colors = [
    'bg-red-200',
    'bg-blue-200',
    'bg-purple-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-teal-200',
  ];
  const userIdBasedOn10 = parseInt(userId, 16);
  const colorIndex = userIdBasedOn10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div
      className={`w-10 h-10 relative bg-red-200 rounded-full flex items-center justify-center ${color}`}
    >
      <div className="opacity-70">{username[0]}</div>
      {online && (
        <div className="absolute w-3.5 h-3.5 bg-green-500 rounded-full bottom-0 right-0 border border-white"></div>
      )}
      {!online && (
        <div className="absolute w-3.5 h-3.5 bg-gray-500 rounded-full bottom-0 right-0 border border-white"></div>
      )}
    </div>
  );
}
