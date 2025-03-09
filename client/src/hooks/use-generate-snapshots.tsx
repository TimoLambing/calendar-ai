import { useCallback, useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "./use-toast";
import { useAppState } from "@/store/appState";
import { usePrivy } from "@privy-io/react-auth";
import { io, Socket } from "socket.io-client";

/**
 * Utility: returns how many days exist between start and end (inclusive),
 * ignoring time-of-day.
 */
function daysInRange(start: Date, end: Date) {
  const startMs = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endMs = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  if (endMs < startMs) return 0;
  const diff = endMs - startMs;
  return Math.floor(diff / 86400000) + 1;
}

interface GenerateSnapshotsParams {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Custom hook to manage snapshot generation with real-time updates via WebSocket.
 */
export default function useGenerateSnapshots() {
  const {
    state: { address, currentWallet },
  } = useAppState();
  const { ready, authenticated, user } = usePrivy();

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );
  const [endDate, setEndDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  );
  const [snapshots, setSnapshots] = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);

  console.log(
    "[useGenerateSnapshots] init => address:",
    address,
    "| currentDate:",
    currentDate,
    "| start:",
    startDate,
    "| end:",
    endDate,
    "| isGenerating:",
    isGenerating,
    "| snapshots.length:",
    snapshots.length
  );

  // -----------------------------
  // WEBSOCKET CONNECTION (Once)
  // -----------------------------
  useEffect(() => {
    const socket = io("http://localhost:6060", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[useGenerateSnapshots] WebSocket connected:", socket.id);
      if (address) {
        socket.emit("joinWalletRoom", address);
      }
    });

    socket.on("snapshotGenerated", (snapshot: any) => {
      console.log("[useGenerateSnapshots] snapshotGenerated:", snapshot);
      setSnapshots((prev) => {
        const dateKey = new Date(snapshot.timestamp)
          .toISOString()
          .split("T")[0];
        const idx = prev.findIndex(
          (s) => new Date(s.timestamp).toISOString().split("T")[0] === dateKey
        );
        if (idx >= 0) {
          // Update existing
          const updated = [...prev];
          updated[idx] = snapshot;
          return updated.sort(
            (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
          );
        } else {
          // Add new
          return [...prev, snapshot].sort(
            (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)
          );
        }
      });
    });

    socket.on("snapshotsGenerated", (data: any) => {
      console.log("[useGenerateSnapshots] snapshotsGenerated =>", data);
      setIsGenerating(false);
    });

    socket.on("disconnect", () => {
      console.log("[useGenerateSnapshots] WebSocket disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [address]);

  // If address changes later, re-join the room
  useEffect(() => {
    if (socketRef.current && address) {
      socketRef.current.emit("joinWalletRoom", address);
    }
  }, [address]);

  // -----------------------------
  // MONTH NAVIGATION
  // -----------------------------
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  // -----------------------------
  // Generate missing snapshots
  // -----------------------------
  const generate = useCallback(
    async (params: GenerateSnapshotsParams) => {
      if (isGenerating) return; // skip if already generating
      if (!ready || !authenticated || !user) {
        toast({
          title: "Not authenticated",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }
      if (!address) {
        toast({
          title: "No Wallet Address",
          description: "Please connect a wallet first",
          variant: "destructive",
        });
        return;
      }

      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        toast({
          title: "Invalid Date Range",
          description: "Cannot generate snapshots for invalid range",
          variant: "destructive",
        });
        return;
      }

      setIsGenerating(true);

      try {
        await apiRequest("POST", `/api/wallets/${address}/snapshots`, {
          chain: currentWallet?.chainType || "ethereum",
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        // Actual creation done in the background,
        // "snapshotGenerated" arrives via WebSocket
      } catch (err: any) {
        console.error("[useGenerateSnapshots] generate error =>", err);
        toast({
          title: "Snapshot Error",
          description: err?.message || "Request failed",
          variant: "destructive",
        });
        setIsGenerating(false);
      }
    },
    [
      address,
      authenticated,
      currentWallet?.chainType,
      isGenerating,
      ready,
      user,
      toast,
    ]
  );

  // -----------------------------
  // 1) Recompute [startDate, endDate] from currentDate
  // 2) Fetch existing snapshots from server for that range
  // 3) If missing days => call generate once
  // -----------------------------
  useEffect(() => {
    const newStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const newEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    setStartDate(newStart);
    setEndDate(newEnd);

    // Clear snapshots if no address
    if (!address) {
      setSnapshots([]);
      return;
    }

    console.log(
      "[useGenerateSnapshots] loading existing for =>",
      newStart,
      newEnd
    );
    (async () => {
      try {
        // Step A: fetch existing
        const qs = new URLSearchParams({
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        });
        const resp = await fetch(`/api/wallets/${address}/snapshots?${qs}`);
        if (!resp.ok) throw new Error("Failed to load existing snapshots");
        const existing = await resp.json();
        setSnapshots(existing);

        const neededDays = daysInRange(newStart, newEnd);
        if (existing.length < neededDays) {
          console.log(
            "[useGenerateSnapshots] missing days => calling generate"
          );
          generate({ startDate: newStart, endDate: newEnd });
        } else {
          console.log("[useGenerateSnapshots] all days exist => no generate");
        }
      } catch (err) {
        console.error("[useGenerateSnapshots] load existing error =>", err);
        toast({
          title: "Snapshot Error",
          description: String(err),
          variant: "destructive",
        });
      }
    })();
  }, [address, currentDate, generate, toast]);

  return {
    currentDate,
    startDate,
    endDate,
    goToPreviousMonth,
    goToNextMonth,
    generate, // for manual triggering if needed
    isGenerating,
    snapshots,
  };
}
