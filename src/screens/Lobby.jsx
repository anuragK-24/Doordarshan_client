import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import LabelledInput from "../components/LabelledInput/LabelledInput";
import "./Lobby.scss";
import lobby_image from "../assets/lobby.svg";

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
    <div className="Lobby">
      <h1>Lobby</h1>
      <div className="Lobby_Content">
        <div className="Lobby_Content_Image">
          <img src={lobby_image} alt="Lobby" />
        </div>

        <div className="Lobby_Content_FormContainer">
          <form
            className="Lobby_Content_FormContainer_Form"
            onSubmit={handleSubmit}
          >
            <LabelledInput
              label={"Email"}
              placeholder={"Enter your Email..."}
              value={email}
              type={"email"}
              onChange={(e) => setEmail(e.target.value)}
            />
            <LabelledInput
              label={"Room Id"}
              placeholder={"Enter Room id..."}
              value={room}
              type={"number"}
              onChange={(e) => setRoom(e.target.value)}
            />

            <button
              className="Lobby_Content_FormContainer_Form_Button"
              type="submit"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
