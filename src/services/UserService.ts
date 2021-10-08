import { Response } from 'express';
import { PrismaClient } from '@prisma/client'
import User from '../model/User'
import ReturnHttp from '../model/ReturnHttp';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()

class UserService {
  public async save(req:any, res:Response) : Promise<Response>{
    if(!req.body){
      return res.status(400)
        .json(new ReturnHttp('Not found body http to update',400,null));
    }
    if(!req.user.company.admin){
      return res.status(401)
        .json(new ReturnHttp('Not Authorization',401,null));
    }
    try {
      let user = req.body as User;
      let passwordEncrypt = bcrypt.hashSync(user.password, 8);
      user.password = passwordEncrypt;
      let up = await prisma.users.create({
        data: user
      })
      if(up){
        return res.json(new ReturnHttp('',200,up.id));
      }else{
        return res.status(500)
          .json(new ReturnHttp(JSON.stringify(up),500,null));
      }
      
    } catch (error:any) {
      return res.status(500)
          .json(new ReturnHttp(JSON.stringify(error),500,null));
    }
  }
  public async update(req:any, res:Response) : Promise<Response>{
    if(!req.query.id){
      return res.status(400)
        .json(new ReturnHttp('Not found id',400,null));
    }
    if(!req.user.company.admin){
      return res.status(401)
        .json(new ReturnHttp('Not Authorization',401,null));
    }
    try { 
      let user = req.body as User;
      let up = await prisma.users.update({
        where: {
          id: Number(req.query.id),
        },
        data: user
      })
      if(up){
        return res.json(new ReturnHttp('',200,up));
      }else{
        return res.status(500)
          .json(new ReturnHttp(JSON.stringify(up),500,null));
      }
    } catch (error:any) {
      return res.status(500)
        .json(new ReturnHttp(JSON.stringify(error),500,null));
    }
  }
  public async get(req:any, res:Response) : Promise<Response>{
    if(!req.query.page){
      return res.status(400)
        .json(new ReturnHttp('Not found page',400,null));
    }
    if(!req.user.company.admin){
      return res.status(401)
        .json(new ReturnHttp('Not Authorization',401,null));
    }
    let param: any = {}
    if(req.query.search){
      param.OR =[
        {
            user: {
            startsWith:req.query.search
          }
        },
        {
            email: {
            startsWith:req.query.search
          }
        },
        {
            phone: {
            startsWith:req.query.search
          }
        }
      ]
    }
    try { 
      const users = await prisma.users.findMany({
        where:param,
        skip: 50 * Number(req.query.page),
        take: 50,
        include: {
          ratings: true,
          companies: true,
        },
      })
      if(users){
        return res.json(new ReturnHttp('',200,users));
      }else{
        return res.json(new ReturnHttp('Empty',404,null));
      }
    } catch (error:any) {
      return res.status(500)
        .json(new ReturnHttp(JSON.stringify(error),500,null));
    }
  }
}
export default new UserService();