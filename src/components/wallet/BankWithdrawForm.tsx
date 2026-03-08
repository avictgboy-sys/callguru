import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  amount: number;
  onSubmit: (bankDetails: Record<string, string>) => void;
  isPending: boolean;
}

const BankWithdrawForm = ({ amount, onSubmit, isPending }: Props) => {
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 text-sm">
        <p className="font-semibold text-foreground">Withdraw ৳{amount.toFixed(2)} to your bank account</p>
        <p className="text-muted-foreground mt-1">Enter your bank details below. Funds will be transferred after admin verification.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground">Account Holder Name</label>
          <Input placeholder="Full name on account" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Bank Name</label>
          <Input placeholder="e.g. Dutch Bangla Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Account Number</label>
          <Input placeholder="Your bank account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Branch Name</label>
          <Input placeholder="e.g. Dhaka Main Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Routing Number (optional)</label>
          <Input placeholder="Bank routing number" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} />
        </div>
      </div>

      <Button
        variant="hero"
        className="w-full"
        disabled={!accountName.trim() || !bankName.trim() || !accountNumber.trim() || isPending}
        onClick={() => onSubmit({ accountName, bankName, accountNumber, branchName, routingNumber })}
      >
        {isPending ? "Submitting…" : "Request Withdrawal"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Bank withdrawals are processed within 1-3 business days after admin approval.
      </p>
    </div>
  );
};

export default BankWithdrawForm;
