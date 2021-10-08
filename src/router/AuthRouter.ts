import { Router } from 'express'
import AuthUser from '../services/AuthUser';
var AuthRouter = Router();

AuthRouter.post('/', AuthUser.Auth)

export default AuthRouter;