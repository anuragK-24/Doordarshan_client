import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";

export default function Room() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

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
        audio: true,
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
    <div>
      <h1>Room page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Streams</button>}
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer height="4em" width="4em" url={myStream} playing />
        </>
      )}

      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer height="4em" width="4em" url={remoteStream} playing />
        </>
      )}
    </div>
  );
}
