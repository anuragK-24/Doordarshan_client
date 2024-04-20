import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import "./Room.scss";
import { useNavigate } from "react-router-dom";
import Draggable from "react-draggable";
import call_icon from "../assets/call.svg"
import end_call_icon from "../assets/end-call.svg"

export default function Room() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [selectedVideo, setSelectedVideo] = useState('remoteStream');
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
  const handleSelect = () =>{
    if(selectedVideo === 'remoteStream'){
      setSelectedVideo('myStream');
    }
    else if(selectedVideo === 'myStream'){
      setSelectedVideo('remoteStream');
    }
  
  }
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
        <button title="Call" className="Room_CallBtn" onClick={handleCallUser}>
          <img src={call_icon} alt="" />
        </button>
      )}
      {remoteSocketId || myStream ? (
        <button title="End call" className="Room_EndBtn" onClick={() => navigate("/")}>
          <img src={end_call_icon} alt="" />
        </button>
      ) : (
        ""
      )}

      <div className="Room_Content">
        {myStream && (
          <Draggable>
            <div className="Room_Content_VideoMy">
              <h4>My Stream</h4>
              <ReactPlayer
                height={ "17em"}
                width={"fitContent"}
                url={myStream}
                playing
              />
            </div>
          </Draggable>
        )}

        {remoteStream && (
          <Draggable>
          <div className="Room_Content_VideoRemote">
            <h4>Remote Stream</h4>
            <ReactPlayer
              height={ "17em"}
              width={"fitContent"}
              backgroundColor="white"
              url={remoteStream}
              playing
            />
          </div>
          </Draggable>
        )}
      </div>
    </div>
  );
}
