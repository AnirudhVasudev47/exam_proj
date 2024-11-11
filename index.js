// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (if any)
app.use(express.static('public'));

// WebRTC setup
let peerConnection;
let localStream;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// Capture the screen
const captureScreen = () => {
    // Use child process to execute Windows-specific screen capture command (e.g., ffmpeg or direct desktop capture)
    exec('ffmpeg -f gdigrab -i desktop -f dshow -vcodec libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -framerate 25 -y screen.mp4', (err, stdout, stderr) => {
        if (err) {
            console.error('Error capturing screen:', err);
            return;
        }
        console.log('Screen captured successfully:', stdout);
    });
};

// WebRTC offer handler
io.on('connection', (socket) => {
    socket.on('offer', async (offer) => {
        peerConnection = new RTCPeerConnection(configuration);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Get local stream for screen capture
        captureScreen();

        // Send tracks to the peer connection
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        peerConnection.ontrack = event => {
            socket.emit('stream', event.streams[0]);
        };

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', answer);
    });

    socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
});

// Start the server
server.listen(3000, () => {
    console.log('WebRTC server running on http://localhost:3000');
});
