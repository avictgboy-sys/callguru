import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Props {
  amount: number;
  onSubmit: (bankDetails: Record<string, string>, proofFile?: File) => void;
  isPending: boolean;
}

const BANK_INFO = {
  bankName: "Example Bank Ltd.",
  accountName: "CallGuru Technologies",
  accountNumber: "1234567890123",
  branch: "Dhaka Main Branch",
  routingNumber: "123456789",
};

const BankTransferForm = ({ amount, onSubmit, isPending }: Props) => {
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
        <p className="font-semibold text-foreground mb-2">Transfer ৳{amount.toFixed(2)} to:</p>
        {Object.entries(BANK_INFO).map(([key, val]) => (
          <div key={key} className="flex justify-between">
            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
            <span className="font-mono font-medium text-foreground">{val}</span>
          </div>
        ))}
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
