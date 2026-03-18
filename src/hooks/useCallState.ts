import { create } from "zustand";

/**
 * Global call state store — prevents concurrent calls and tracks call lifecycle.
 * States: idle → ringing → connected → ended → idle
 */

export type CallStatus = "idle" | "ringing" | "connected" | "ended";

interface CallState {
  status: CallStatus;
  activeCallId: string | null;
  setStatus: (status: CallStatus, callId?: string | null) => void;
  reset: () => void;
  isInCall: () => boolean;
}

export const useCallState = create<CallState>((set, get) => ({
  status: "idle",
  activeCallId: null,
  setStatus: (status, callId) =>
    set({
      status,
      activeCallId: callId ?? (status === "idle" || status === "ended" ? null : get().activeCallId),
    }),
  reset: () => set({ status: "idle", activeCallId: null }),
  isInCall: () => {
    const s = get().status;
    return s === "ringing" || s === "connected";
  },
}));
