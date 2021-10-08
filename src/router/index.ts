import express from 'express';

import UserRouter from './UserRouter';
import AuthRouter from './AuthRouter';
import AuthUser from '../services/AuthUser';
var RootRouter = express();
RootRouter.use("/auth", AuthRouter);

RootRouter.use(AuthUser.VerifyAccess);
RootRouter.use("/user", UserRouter);


export default RootRouter;