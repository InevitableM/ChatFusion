import React from "react";
import { useState ,useEffect} from "react";
import {useRef} from "react";
import "./App.css";

function Chat( {username,room,socket}){

    const[msg,setmsg]=useState('');
    const[showmessage,setshowmessage]=useState([]);
const[img,setimg]=useState('');
const localVideoRef=useRef();
const remoteVideoRef=useRef();
const localStreamRef=useRef();
const peerConnectionRef=useRef();

const sendmessage=async ()=>{
    const data={
        usename:username,
        room:room,
        message:msg,
        img:img,
    sentbyMe:true,
       } 
   setmsg('');
   setimg('');

       await socket.emit('sendmsg',data);
    setshowmessage((prevMessages) => [...prevMessages, {...data,sentbyMe:true}]);
    
};


useEffect(() => {
    const handleReceiveMessage = (data) => {
        setshowmessage((prevMessages) => [...prevMessages, { ...data, sentbyMe:data.username === username }]);
    };
    socket.on('recvmsg', handleReceiveMessage);

    return () => {
        socket.off('recvmsg', handleReceiveMessage);
    };
}, [username,socket]);

const image=(e)=>{
    const file= e.target.files[0];
      if(file){
        const reader= new FileReader();
        reader.onload=()=>{
            const base64=reader.result;
            setimg(base64);
        };
        reader.readAsDataURL(file);
      }
}

useEffect(()=>{
    socket.on('offer', async(data) => {
   if(peerConnectionRef.current){
   await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
   const ans=await peerConnectionRef.current.createAnswer();
   await peerConnectionRef.current.setLocalDescription(ans);
   socket.emit('answer',{answer:ans,room:room});
   }   
});

socket.on('answer',async(data)=>{
    if(peerConnectionRef.current){
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('candidate',async(data)=>{
    if(peerConnectionRef.current){
        await peerConnectionRef.current.addIceCandidate(data.candidate);
    }
});
return () => {
    socket.off('offer');
    socket.off('answer');
    socket.off('candidate');
};
    },[socket,username,room]);

    const startVideoChat = async () => {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = localStreamRef.current;

        peerConnectionRef.current = new RTCPeerConnection();
        localStreamRef.current.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, localStreamRef.current));

        peerConnectionRef.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', { candidate: event.candidate, room });
            }
        };

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit('offer', { offer, room });
    };

    return(
        <div className="div">
            <p className="name"> User : {username}</p>
<div className="container">

    <div className="chatbox">
    {showmessage.map((value)=>(
        <div key={value.message}>
         <p  className={value.sentbyMe ? 'sent':'receive'} >{value.message}</p>
         <p  className={value.sentbyMe ? 'sent small-text':'receive small-text'} >sent by: {value.usename}</p>
     {  value.img && (<div className={value.sentbyMe?'sent':'receive'}><img   src={value.img} alt="img" style={{width: '150px'}} />
         <p  className={value.sentbyMe ? 'sent small-text':'receive small-text'} >sent by: {value.usename}</p>
       </div>) }
        </div>
    ) ) }
</div>
   
<div className="entermessage">
     <input type="text" className="chatfoot" 
    value={msg}
    onKeyDown={(e)=>{
        if(e.key==='Enter'){
            sendmessage();  
        }}}
    placeholder="Enter message" onChange={(event)=>{setmsg(event.target.value)}}/> 
    <button onClick={sendmessage}>send</button>

    <input type="file" accept="image/*" className="input" onChange={image}></input>
 </div>
      
     <div className="videochat">
     <video ref={localVideoRef} autoPlay muted style={{width:'300px',height:'300px'}}></video>
     <video ref={remoteVideoRef} autoPlay style={{width:'300px',height:'300px'}}></video>
     <div className="vid"><button  className="vidbtn" onClick={startVideoChat}>Click to Start video chat</button>
     </div>
     </div>

</div>

</div>
    );
}

export default Chat;