import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import "./Room.scss";
import { useNavigate } from "react-router-dom";

export default function Room() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const navigate = useNavigate();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined with id ${id}`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setMyStream(stream);
      console.log(`Incoming call`, from, offer);
      const answer = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, answer });
    },
    [socket]
  );
  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, answer }) => {
      peer.setLocalDescription(answer);
      console.log(`Call accepted`, from, answer);
      sendStreams();
    },
    [sendStreams]
  );
  const handleNegotiation = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);

  const handleNegotiationIncoming = useCallback(
    async ({ from, offer }) => {
      const answer = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, answer });
    },
    [socket]
  );

  const handleNegotiationFinal = useCallback(async ({ answer }) => {
    await peer.setLocalDescription(answer);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (event) => {
      const remoteStream = event.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegotiationIncoming);
    socket.on("peer:nego:final", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegotiationIncoming);
      socket.off("peer:nego:final", handleNegotiationFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegotiationIncoming,
    handleNegotiationFinal,
  ]);
  return (
    <div className="Room">
      <h1>Room page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      
      {myStream && (
        <button className="Room_SendBtn" onClick={sendStreams}>
          Send Streams
        </button>
      )}
      {remoteSocketId && (
        <button className="Room_CallBtn" onClick={handleCallUser}>
          Call
        </button>
      )}
      {remoteSocketId || myStream ? (
        <button className="Room_EndBtn" onClick={()=>navigate('/')} > End Call </button>) : ""
        }

      <div className="Room_Content">
        {myStream && (
          <div className="Room_Content_Video">
            <h4>My Stream</h4>
            <ReactPlayer height="17em" width="26em" url={myStream} playing />
          </div>
        )}

        {remoteStream && (
          <div className="Room_Content_Video">
            <h4>Remote Stream</h4>
            <ReactPlayer
              height="17em"
              width="24em"
              url={remoteStream}
              playing
            />
          </div>
        )}
      </div>
    </div>
  );
}
