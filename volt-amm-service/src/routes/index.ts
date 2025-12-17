import { Router } from 'express';
import { poolsRouter } from './pools';
import { walletsRouter } from './wallets';

const router = Router();

router.use('/pools', poolsRouter);
router.use('/wallets', walletsRouter);

export { router };
