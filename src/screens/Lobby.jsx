import { useState, useCallback, useEffect } from "react";

import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
export default function Lobby() {
  const socket = useSocket();
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault(); //  method is used to stop the default action of an element from happening.
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );
  const handleRoomJoin = useCallback(
    (data) => {
      const { email, room } = data;
      console.log(email, room);
      navigate(`/room/${room}`, { state: { email, room } });
    },
    [navigate]
  );
  useEffect(() => {
    socket.on("room:join", handleRoomJoin);
    return () => {
      socket.off("room:join", handleRoomJoin);
    };
  }, [socket, handleRoomJoin]);
  return (
    <div>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="room">Room Id </label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br />
        <button type="submit">Join</button>
      </form>
    </div>
  );
}
