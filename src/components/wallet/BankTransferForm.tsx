import { useState, useRef } from "react";
import { useMerchantNumbers } from "@/hooks/useAppSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Props {
  amount: number;
  onSubmit: (bankDetails: Record<string, string>, proofFile?: File) => void;
  isPending: boolean;
}

const BankTransferForm = ({ amount, onSubmit, isPending }: Props) => {
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const merchants = useMerchantNumbers();

  const bankInfo = [
    { label: "Bank Name", value: merchants.bankName },
    { label: "Account Name", value: merchants.bankAccountName },
    { label: "Account Number", value: merchants.bankAccountNumber },
    { label: "Branch", value: merchants.bankBranch },
    { label: "Routing Number", value: merchants.bankRouting },
  ].filter((item) => item.value);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
        <p className="font-semibold text-foreground mb-2">Transfer ৳{amount.toFixed(2)} to:</p>
        {bankInfo.length > 0 ? (
          bankInfo.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono font-medium text-foreground">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground italic">Bank details not configured yet. Please contact support.</p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground">Your Name</label>
          <Input placeholder="Account holder name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Your Bank</label>
          <Input placeholder="e.g. Dutch Bangla Bank" value={senderBank} onChange={(e) => setSenderBank(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Transaction Reference</label>
          <Input placeholder="Bank reference number" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Upload Proof (optional)</label>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {proofFile ? proofFile.name : "Choose file"}
          </Button>
        </div>
      </div>

      <Button
        variant="hero"
        className="w-full"
        disabled={!senderName.trim() || !referenceId.trim() || isPending}
        onClick={() =>
          onSubmit(
            { senderName, senderBank, referenceId },
            proofFile || undefined
          )
        }
      >
        {isPending ? "Submitting…" : "Submit Transfer Details"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your balance will be updated after admin verification (usually within 24 hours).
      </p>
    </div>
  );
};

export default BankTransferForm;
