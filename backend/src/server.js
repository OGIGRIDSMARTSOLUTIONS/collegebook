require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./websocket/socket');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CollegeBook backend listening on port ${PORT}`);
});
