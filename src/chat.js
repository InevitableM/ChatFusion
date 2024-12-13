import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function Chat({ username, room, socket }) {
  const [msg, setmsg] = useState("");
  const [showmessage, setshowmessage] = useState([]);
  const [img, setimg] = useState("");
  const [isVideoChatActive, setIsVideoChatActive] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef();
  const peerConnectionRef = useRef();

  const sendmessage = async () => {
    if(msg.length === 0 && img.length === 0) {
        alert("Please enter a message or select an image to send");
        return;
    }
    const data = {
      usename: username,
      room: room,
      message: msg,
      img: img,
      sentbyMe: true,
    };
    setmsg("");
    setimg("");

    await socket.emit("sendmsg", data);
    setshowmessage((prevMessages) => [...prevMessages, { ...data, sentbyMe: true }]);
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setshowmessage((prevMessages) => [
        ...prevMessages,
        { ...data, sentbyMe: data.username === username },
      ]);
    };
    socket.on("recvmsg", handleReceiveMessage);

    return () => {
      socket.off("recvmsg", handleReceiveMessage);
    };
  }, [username, socket]);

  const image = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setimg(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    socket.on("offer", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const ans = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(ans);
        socket.emit("answer", { answer: ans, room: room });
      }
    });

    socket.on("answer", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on("candidate", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    };
  }, [socket, username, room]);

  const startVideoChat = async () => {
    setIsVideoChatActive(true);
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = localStreamRef.current;

    peerConnectionRef.current = new RTCPeerConnection();
    localStreamRef.current.getTracks().forEach((track) =>
      peerConnectionRef.current.addTrack(track, localStreamRef.current)
    );

    peerConnectionRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", { candidate: event.candidate, room });
      }
    };
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer, room });
  };

  const endvideo = () => {
    setIsVideoChatActive(false);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    localVideoRef.current.srcObject = null;
    remoteVideoRef.current.srcObject = null;
    peerConnectionRef.current = null;
  };

  return (
    <div className="div">
      <div className="chat-header">
        <p>
          <strong>User:</strong> {username}
        </p>
        <p>
          <strong>Room:</strong> {room}
        </p>
      </div>

      <div className="container">
       <div className="chatbox">
  {showmessage.map((value, index) => (
    <div
      key={index}
      className={value.sentbyMe ? "message-container sent" : "message-container received"}
    >
      <p className="message-text">{value.message}</p>
      {value.img && (
        <img
          src={value.img}
          alt="sent"
          className="message-image"
        />
      )}
      <p className="small-text">sent by: {value.usename}</p>
    </div>
  ))}
</div>
        <div className="entermessage">
          <input
            type="text"
            className="chatfoot"
            value={msg}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendmessage();
              }
            }}
            placeholder="Enter message"
            onChange={(event) => {
              setmsg(event.target.value);
            }}
          />
          <button onClick={sendmessage}>Send</button>
          <input type="file" accept="image/*" className="input" onChange={image} />
        </div>
        {isVideoChatActive && (
          <div className="videochat">
            <div className="video-container">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="video"
              ></video>
              <video ref={remoteVideoRef} autoPlay className="video"></video>
            </div>
            <div className="vid-buttons">
              <button className="vidbtn" onClick={endvideo}>
                End Video Chat
              </button>
            </div>
          </div>
        )}

        <button className="vidbtn" onClick={startVideoChat}>
          Click to Start Video Chat
        </button>
      </div>
    </div>
  );
}

export default Chat;
