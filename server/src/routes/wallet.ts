import { Router } from "express";
import {
  getWalletHistory,
  getWalletSnapshots,
  getWallet,
  followWallet,
  unfollowWallet,
  getFollowedWallets,
  createOrUpdateWallet,
  dailyFullHistory,
  generateWalletSnapshots,
} from "../controllers/walletController";

const router = Router();

router.get("/wallets/:address/history", getWalletHistory);
router.post("/wallets/:address/snapshots", generateWalletSnapshots);
router.get("/wallets/:address/snapshots", getWalletSnapshots);
router.get("/wallets/:address", getWallet);

// new route for building full daily history
router.get("/wallets/:address/full-history", dailyFullHistory);

router.post("/followed-wallets", followWallet);
router.delete("/followed-wallets/:address", unfollowWallet);
router.get("/followed-wallets", getFollowedWallets);
router.post("/wallets", createOrUpdateWallet);

export default router;
