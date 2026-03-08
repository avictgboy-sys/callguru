import { useState } from "react";
import { PaymentMethod } from "@/hooks/usePayment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOBILE_NAMES: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

interface Props {
  method: PaymentMethod;
  amount: number;
  onSubmit: (details: Record<string, string>) => void;
  isPending: boolean;
}

const MobileWithdrawForm = ({ method, amount, onSubmit, isPending }: Props) => {
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const name = MOBILE_NAMES[method] || method;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
        <p className="font-semibold text-foreground">Withdraw ৳{amount.toFixed(2)} via {name}</p>
        <p className="text-muted-foreground">
          Enter your {name} account details below. Funds will be sent after admin verification.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground">Account Holder Name</label>
          <Input placeholder="Your full name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">{name} Number</label>
          <Input placeholder="e.g. 01XXXXXXXXX" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        </div>
      </div>

      <Button
        variant="hero"
        className="w-full"
        disabled={!accountNumber.trim() || !accountName.trim() || isPending}
        onClick={() => onSubmit({ accountName, accountNumber, method })}
      >
        {isPending ? "Submitting…" : "Request Withdrawal"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Withdrawals are processed within 1-24 hours after admin approval.
      </p>
    </div>
  );
};

export default MobileWithdrawForm;
