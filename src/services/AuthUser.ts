import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ReturnHttp from '../model/ReturnHttp';
import jwt from 'jsonwebtoken';
import UserTime from '../model/UserTime';
import SocketService from '../utils/SocketService';

const prisma = new PrismaClient()
class AuthUser {
    public async Auth(req: Request, res: Response): Promise<Response> {
        try {
            const token: any = req.headers['access-token'];
            const secret: any = req.headers['secret-access-token'];
            if (!token || !secret) {
                return res.status(401)
                    .json(new ReturnHttp('Not Found Authorization token', 401, null));
            }
            if (!req.body || !req.body.user || !req.body.password) {
                return res.status(400)
                    .json(new ReturnHttp('Not Found Authorization body request', 400, null));
            }
            const company = await prisma.companies.findFirst({
                where: {
                    secretToken: secret,
                    accessToken: token,
                    active: true
                },
                select: {
                    id: true,
                    email: true,
                    admin: true,
                    companyName: true,
                    alertPhone: true,
                },
            })
            if (!company) {
                return res.status(401)
                    .json(new ReturnHttp('Not Found Authorization Company', 401, null));
            }
            let paramWhere:any = {
                    user: req.body.user,
                    companyId: company.id,
                    active: true
            }
            if(company.admin){
                paramWhere = {
                    user: req.body.user,
                    active: true
                }

            }
            const user = await prisma.users.findFirst({
                where: paramWhere,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    user: true,
                    companies:true,
                }
            })
            if (!user) {
                return res.status(401)
                    .json(new ReturnHttp('Not Found Authorization User or Password', 401, null));
            }
            const SECRET_ENCRYPT: any | null = process.env.SECRET;
            const accessResponse = jwt.sign({
                user,
                company
            }, SECRET_ENCRYPT, {
                expiresIn: 300 // expires in 5min
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
                return   next(new Error("Socket authentication error"));
            }
            if (!token[1] || token[0] != process.env.TYPE_ACCESS) 
                return  next(new Error("Socket authentication error"));
         
            const SECRET_ENCRYPT: any | null = process.env.SECRET;
            jwt.verify(token[1], SECRET_ENCRYPT, async function (err: any, decoded: any) {
                if (err) return next(new Error("Socket authentication error"));
                
                const user = await prisma.users.findFirst({
                    where: {
                        id: Number(decoded.user.id),
                        companyId: decoded.user.companies.id,
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
                let userTimes = new UserTime();
                userTimes.userId = decoded.user.id;
                userTimes.loginDate = new Date();
                await prisma.userstimes.create({data:userTimes});
                
            return next();
            });
        } catch (error: any) {
            return  next(new Error("Socket authentication error"));
        }
        
    }
    public async DisconnectSocket(socket:any) {
        let userLogin = await prisma.users.findFirst({
            where: {
                tokenSocket: socket.id,
              }
        });
        
        await prisma.$executeRaw(`UPDATE userstimes SET active = false,logoutDate = '${new Date().toISOString().replace("T"," ").split(".")[0]}'  WHERE active = true and userId = ${userLogin?.id}`);
        await prisma.$executeRaw(`UPDATE Users SET status = 1 WHERE tokenSocket = '${socket.id}'`);
    }
    public async ActiveUserAll() {
        await prisma.$executeRaw(`UPDATE userstimes SET active = false,logoutDate = '${new Date().toISOString().replace("T"," ").split(".")[0]}'  WHERE active = true`);
        await prisma.$executeRaw('UPDATE Users SET status = 1 WHERE status = 0');
    }
    public async UserLogin(status:boolean = true, user:any){
        let io = SocketService();
        io.emit("users.list",{login: status, user});
    }
}

export default new AuthUser();