import { Router } from "express";

const router = Router();

router.get("/raizes", (req, res) => {
  res.json({
    mensagem: "Raízes do Nordeste",
  });
});

export default router;