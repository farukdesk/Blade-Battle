const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const PORT = process.env.PORT || 3000;

if (!TIKTOK_USERNAME) {
  console.warn('WARNING: TIKTOK_USERNAME environment variable is not set. No TikTok events will be received.');
  console.warn('Set it with: TIKTOK_USERNAME=your_tiktok_username node server.js');
}

app.use(express.static('public'));

const tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME || '');

if (TIKTOK_USERNAME) {
  tiktokConnection.connect().then(() => {
    console.log(`Connected to TikTok Live for @${TIKTOK_USERNAME}`);
  }).catch((err) => {
    console.error(`Failed to connect to TikTok Live for @${TIKTOK_USERNAME}:`, err.message);
    console.error('The server will continue running, but no TikTok events will be received.');
  });
}

tiktokConnection.on('chat', (data) => {
  io.emit('spawnBlade', {
    uniqueId: data.uniqueId,
    profilePictureUrl: data.profilePictureUrl,
    size: 50,
  });
});

tiktokConnection.on('gift', (data) => {
  io.emit('spawnBlade', {
    uniqueId: data.uniqueId,
    profilePictureUrl: data.profilePictureUrl,
    size: 150,
    boosted: true,
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Blade Battle server running on http://localhost:${PORT}`);
});
