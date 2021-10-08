import { Router } from 'express'
import UserService from '../services/UserService'
var UserRouter = Router();

UserRouter.post('/', UserService.save)
UserRouter.put('/', UserService.update)
UserRouter.get('/', UserService.get)

export default UserRouter;