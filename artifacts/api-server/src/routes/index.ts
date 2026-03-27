import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import participantsRouter from "./participants";
import votingRouter from "./voting";
import rampwalkRouter from "./rampwalk";
import resultsRouter from "./results";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/participants", participantsRouter);
router.use("/voting", votingRouter);
router.use("/rampwalk", rampwalkRouter);
router.use("/results", resultsRouter);

export default router;
