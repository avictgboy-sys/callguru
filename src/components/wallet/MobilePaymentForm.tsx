import { useState } from "react";
import { PaymentMethod } from "@/hooks/usePayment";
import { useMerchantNumbers } from "@/hooks/useAppSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const METHOD_CONFIG: Record<string, { label: string; type: string; color: string }> = {
  bkash: { label: "bKash", type: "Payment", color: "text-orange-500" },
  nagad: { label: "Nagad", type: "Payment", color: "text-red-500" },
  rocket: { label: "Rocket", type: "Payment", color: "text-purple-500" },
};

interface Props {
  method: PaymentMethod;
  amount: number;
  onSubmit: (referenceId: string) => void;
  isPending: boolean;
}

const MobilePaymentForm = ({ method, amount, onSubmit, isPending }: Props) => {
  const [txnId, setTxnId] = useState("");
  const merchants = useMerchantNumbers();
  const config = METHOD_CONFIG[method];

  if (!config) return null;

  const merchantNumber =
    method === "bkash" ? merchants.bkash :
    method === "nagad" ? merchants.nagad :
    merchants.rocket;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
        <p className="font-semibold text-foreground">How to pay via {config.label}:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Open your {config.label} app</li>
          <li>Go to <span className="font-medium text-foreground">{config.type}</span></li>
          <li>Send <span className={`font-bold ${config.color}`}>৳{amount.toFixed(2)}</span> to <span className="font-mono font-bold text-foreground">{merchantNumber || "Not configured"}</span></li>
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
