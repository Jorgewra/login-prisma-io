import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ReturnHttp from '../model/ReturnHttp';
import jwt from 'jsonwebtoken';
import SocketService from '../utils/SocketService';

const prisma = new PrismaClient()
class AuthUser {
    public async Auth(req: Request, res: Response): Promise<Response> {
        try {
            
            if (!req.body || !req.body.user || !req.body.password) {
                return res.status(400)
                    .json(new ReturnHttp('Not Found Authorization body request', 400, null));
            }
            
            let paramWhere:any = {
                    user: req.body.user,
                    active: true
            }
            
            const user = await prisma.users.findFirst({
                where: paramWhere,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    user: true,
                }
            })
            if (!user) {
                return res.status(401)
                    .json(new ReturnHttp('Not Found Authorization User or Password', 401, null));
            }
            const SECRET_ENCRYPT: any | null = process.env.SECRET;
            const accessResponse = jwt.sign({
                user
            }, SECRET_ENCRYPT, {
                expiresIn: 300
            });
            const dataResponse = {
                token: accessResponse,
                type: process.env.TYPE_ACCESS
            }
            return res.json(new ReturnHttp('success', 200, dataResponse));
        } catch (error: any) {
            return res.status(500)
                .json(new ReturnHttp(JSON.stringify(error), 500, null));
        }
    }

    public async VerifyAccess(req: any, res: Response, next: Function) {
        try {
            const authorizations:string | "" = req.headers['authorization'];
            const token:any | [] =  authorizations.toString().split(" ");
            if(token.length < 1){
                return res.status(401).json(new ReturnHttp('Not Found Authorization User or Password(1)', 401, null));
            }
            if (!token[1] || token[0] != process.env.TYPE_ACCESS) 
                return res.status(401).json(new ReturnHttp('Not Found Authorization User or Password(2)', 401, null));
                
            const SECRET_ENCRYPT: any | null = process.env.SECRET;
            jwt.verify(token[1], SECRET_ENCRYPT, function (err: any, decoded: any) {
                if (err) return res.status(500).json(new ReturnHttp('Not Found Authorization User or Password(3)', 401, null));
                
                req.user = decoded;
                return next();
            });
        } catch (error: any) {
            return res.status(500)
                .json(new ReturnHttp(JSON.stringify(error), 500, null));
        }
        
    }
    public async VerifyAccessSocket(socket:any, next:Function) {
        try {
            const authorizations:string | "" = socket.handshake.headers['auth'];
            
            const token:any | [] =  authorizations.toString().split(" ");
            if(token.length < 1){
                return   next(new Error("Socket authentication error 1"));
            }
            if (!token[1] || token[0] != process.env.TYPE_ACCESS) 
                return  next(new Error("Socket authentication error 2"));
         
            const SECRET_ENCRYPT: any | null = process.env.SECRET;
            jwt.verify(token[1], SECRET_ENCRYPT, async function (err: any, decoded: any) {
                if (err) return next(new Error("Socket authentication error 3"));
                
                const user = await prisma.users.findFirst({
                    where: {
                        id: Number(decoded.user.id),
                        active: true
                    },
                    select: {
                       status:true,
                       tokenSocket:true
                    },
                });
                if(user?.status ===0 && user?.tokenSocket !==socket.id)
                    return  next(new Error("Socket authentication error"));
                    
                await prisma.users.update({
                    where: {
                      id: Number(decoded.user.id),
                    },
                    data: {
                        tokenSocket: socket.id,
                        status: 0
                    }
                });
                socket.user = decoded;
            return next();
            });
        } catch (error: any) {
            return  next(new Error("Socket authentication error"));
        }
        
    }
    public async DisconnectSocket(socket:any) {
        await prisma.$executeRaw(`UPDATE Users SET status = 1 WHERE tokenSocket = '${socket.id}'`);
    }
    public async ActiveUserAll() {
        await prisma.$executeRaw('UPDATE Users SET status = 1 WHERE status = 0');
    }

    public async UserLogin(status:boolean = true, user:any){
        let io = SocketService();
        io.emit("users.login",{login: status, user});
    }
}

export default new AuthUser();