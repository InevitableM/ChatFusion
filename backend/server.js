const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');


const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"],
    },
});

io.on('connect', (socket) => {
    socket.on('joinroom',(data)=>{
        socket.join(data);  
        console.log('user joined with room',data); 
    });

    socket.on('usermsg',(data)=>{
        socket.join(data);
        console.log("username is :",data);
    });

    socket.on('sendmsg',(data)=>{
        socket.to(data.room).emit('recvmsg',data);
    });
    
    socket.on('disconnect',()=>{
        console.log('user disconnected');
    });

    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', data);
    });
    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', data);
    });
    socket.on('candidate', (data) => {
        socket.to(data.room).emit('candidate', data);
    });
});


server.listen(3001, () => {
    console.log('Server is running');
});