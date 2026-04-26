// bridge-server/tests/server.test.js
const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

describe("WebSocket Bridge", () => {
  let io, serverSocket, clientDesktop, clientMobile;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Setup minimal bridge logic
      io.on("connection", (socket) => {
        socket.on("join-room", (roomId) => socket.join(roomId));
        socket.on("motion-data", (data) => {
          socket.to(data.roomId).emit("motion-data", data);
        });
      });

      clientDesktop = new Client(`http://localhost:${port}`);
      clientMobile = new Client(`http://localhost:${port}`);
      
      let connected = 0;
      const checkDone = () => { if (++connected === 2) done(); };
      clientDesktop.on("connect", checkDone);
      clientMobile.on("connect", checkDone);
    });
  });

  afterAll(() => {
    io.close();
    clientDesktop.close();
    clientMobile.close();
  });

  test("should relay motion data from mobile to desktop in same room", (done) => {
    const roomId = "room-123";
    clientDesktop.emit("join-room", roomId);
    clientMobile.emit("join-room", roomId);

    clientDesktop.on("motion-data", (data) => {
      expect(data.accel.x).toBe(1.5);
      done();
    });

    setTimeout(() => {
      clientMobile.emit("motion-data", { roomId, accel: { x: 1.5, y: 0, z: 0 } });
    }, 50);
  });
});