import express from "express";
import cors from "cors";
import RootRouter from "./src/router";
import AuthUser from "./src/services/AuthUser";
import SocketService from "./src/utils/SocketService";

// rest of the code remains same
const app = express();
const PORT = process.env.PORT ? process.env.PORT : 3333;
app.set("port", process.env.PORT || 3333);
let httpServe = require("http").Server(app);

app.use(cors());
app.use(
  express.json({
    limit: "20mb",
  })
);
// set up socket.io and bind it to our
// http server.
let io = SocketService(httpServe);
io.use((socket: any, next: any) => {
  AuthUser.VerifyAccessSocket(socket, next);
});
io.on("connection", function (socket: any) {
  console.log("a user connected" + socket.id);

  socket.on("disconnect", function (message: any) {
    AuthUser.DisconnectSocket(socket);
    AuthUser.UserLogin(false,socket.user.user);
  });
  socket.emit("profile",socket.user.user);
  AuthUser.UserLogin(true, socket.user.user);
});

app.use("/api", RootRouter);

httpServe.listen(PORT, function () {
  AuthUser.ActiveUserAll();
  console.log(`listening on *:${PORT}`);
});
