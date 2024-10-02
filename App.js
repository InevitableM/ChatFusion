import "./App.css";
import io from "socket.io-client";
import { useState } from "react";
import Chat from './chat';


const socket=io.connect("http://localhost:3001");

function App() {

  const [usname,setusname]=useState("");
  const [room,setroom]=useState("");
  const [showchat,setshowchat]=useState(false);

const joinroom=()=>{
    socket.emit('joinroom',room);
    setshowchat(true);
  }

const username=()=>{
  socket.emit('usermsg',usname);
}

const handleEnterClick = () => {
  joinroom();
  username();
}

  
  return (
    <div>
            {showchat ? (
             <div className="chat">   <Chat username={usname} socket ={socket } room={room} /> </div>
            ) : (
              <div className="welcome-container">
              
                <h1>Welcome to ChatFusion</h1>
              
              <div className="user">
                <h1>Chat App</h1>
                <input
                  placeholder="Username"
                  onChange={(event) => { setusname(event.target.value); }}
                />
                <input
                  placeholder="Room"
                  onChange={(event) => { setroom(event.target.value); }}
                />
                <button onClick={handleEnterClick}>Enter Room</button>
              </div>
            </div>
          )}
        </div>
  );
}
export default App;