// createExe.js
const path = require('path');
const { exec } = require('child_process');
const Service = require('node-windows').Service;

// Create a new service to run the server script as a background process
const svc = new Service({
    name: 'WebRTC Screen Streamer',
    description: 'WebRTC server that streams the screen of the PC',
    script: path.join(__dirname, 'index.js'), // Path to your server.js file
});

svc.on('install', () => {
    console.log('Service installed!');
    svc.start();
});

// Install the service (which will convert the script into an executable)
svc.install();
