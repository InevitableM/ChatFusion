import "./App.css";
import io from "socket.io-client";
import { useState } from "react";
import Chat from './chat';

const socket = io.connect("http://localhost:3001");

function App() {
  const [usname, setusname] = useState("");
  const [room, setroom] = useState("");
  const [showchat, setshowchat] = useState(false);

  const joinroom = () => {
    if (room.trim() && usname.trim()) {
      socket.emit('joinroom', room);
      setshowchat(true);
    } else {
      alert("Both Username and Room are required!");
    }
  };

  return (
    <div className="app-container">
      {showchat ? (
        <Chat username={usname} socket={socket} room={room} />
      ) : (
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="app-title">Welcome to ChatFusion</h1>
            <div className="user-form">
              <h2 className="form-title">Join a Room</h2>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your Username"
                value={usname}
                onChange={(e) => setusname(e.target.value)}
              />
              <input
                className="form-input"
                type="text"
                placeholder="Enter Room ID"
                value={room}
                onChange={(e) => setroom(e.target.value)}
              />
              <button className="form-button" onClick={joinroom}>
                Enter Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
