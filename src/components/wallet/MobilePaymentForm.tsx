import { useState } from "react";
import { PaymentMethod } from "@/hooks/usePayment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOBILE_INFO: Record<string, { merchant: string; type: string; color: string }> = {
  bkash: { merchant: "01XXXXXXXXX", type: "Send Money", color: "text-orange-500" },
  nagad: { merchant: "01XXXXXXXXX", type: "Send Money", color: "text-red-500" },
  rocket: { merchant: "01XXXXXXXXXXX", type: "Send Money", color: "text-purple-500" },
};

interface Props {
  method: PaymentMethod;
  amount: number;
  onSubmit: (referenceId: string) => void;
  isPending: boolean;
}

const MobilePaymentForm = ({ method, amount, onSubmit, isPending }: Props) => {
  const [txnId, setTxnId] = useState("");
  const info = MOBILE_INFO[method];

  if (!info) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
        <p className="font-semibold text-foreground">How to pay via {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Rocket"}:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Open your {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Rocket"} app</li>
          <li>Go to <span className="font-medium text-foreground">{info.type}</span></li>
          <li>Send <span className={`font-bold ${info.color}`}>৳{amount.toFixed(2)}</span> to <span className="font-mono font-bold text-foreground">{info.merchant}</span></li>
          <li>Enter the <span className="font-medium text-foreground">Transaction ID</span> below</li>
        </ol>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Transaction ID</label>
        <Input
          placeholder="e.g. TXN123456789"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
        />
      </div>

      <Button
        variant="hero"
        className="w-full"
        disabled={!txnId.trim() || isPending}
        onClick={() => onSubmit(txnId.trim())}
      >
        {isPending ? "Submitting…" : "Submit Payment"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your balance will be updated after admin verification (usually within 1-2 hours).
      </p>
    </div>
  );
};

export default MobilePaymentForm;
