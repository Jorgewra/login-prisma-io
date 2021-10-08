let io:any = null;

export default function SocketService (http?:any){
    if(!io){
        io = require("socket.io")(http);
    }
    return io;
}