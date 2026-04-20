const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    // Socket cleanup hook.
  });
});

connectDB();

server.listen(PORT, () => {
  console.log(`ElectroMap Server running on port ${PORT}`);
});
