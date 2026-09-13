import { Router, type IRouter } from "express";
import healthRouter from "./health";
import noticesRouter from "./notices";

const router: IRouter = Router();

router.use(healthRouter);
router.use(noticesRouter);

export default router;
