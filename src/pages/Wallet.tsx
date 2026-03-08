import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletTransactions, useTopUp, useWithdraw } from "@/hooks/useWallet";
import {
  usePaymentRequests,
  useCreatePaymentRequest,
  useUploadProof,
  PaymentMethod,
  PAYMENT_METHODS,
} from "@/hooks/usePayment";
import PaymentMethodSelector from "@/components/wallet/PaymentMethodSelector";
import MobilePaymentForm from "@/components/wallet/MobilePaymentForm";
import BankTransferForm from "@/components/wallet/BankTransferForm";
import MobileWithdrawForm from "@/components/wallet/MobileWithdrawForm";
import BankWithdrawForm from "@/components/wallet/BankWithdrawForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Video, ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight,
  Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Wallet = () => {
  const { profile } = useAuth();
  const { data: transactions, isLoading } = useWalletTransactions();
  const { data: paymentRequests } = usePaymentRequests();
  const topUp = useTopUp();
  const withdraw = useWithdraw();
  const createPayment = useCreatePaymentRequest();
  const uploadProof = useUploadProof();

  const [dialogType, setDialogType] = useState<"topup" | "withdraw" | null>(null);
  const [step, setStep] = useState<"amount" | "method" | "details">("amount");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const balance = profile?.wallet_balance ?? 0;

  const totalIn = transactions
    ?.filter((t) => t.type === "topup" || t.type === "earning")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalOut = transactions
    ?.filter((t) => t.type === "withdraw" || t.type === "spending")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  const resetDialog = () => {
    setDialogType(null);
    setStep("amount");
    setAmount("");
    setSelectedMethod(null);
  };

  const handleAmountNext = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setStep("method");
  };

  const handleWithdraw = async (val: number) => {
    try {
      await withdraw.mutateAsync(val);
      toast.success(`৳${val.toFixed(2)} withdrawn`);
      resetDialog();
    } catch (e: any) {
      toast.error(e.message || "Withdrawal failed");
    }
  };

  const handleMobileSubmit = async (referenceId: string) => {
    try {
      await createPayment.mutateAsync({
        amount: parseFloat(amount),
        method: selectedMethod!,
        type: dialogType as "topup" | "withdraw",
        reference_id: referenceId,
      });
      toast.success(dialogType === "topup"
        ? "Payment submitted! Your balance will update after verification."
        : "Withdrawal request submitted! You'll be paid after admin approval.");
      resetDialog();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    }
  };

  const handleBankSubmit = async (bankDetails: Record<string, string>, proofFile?: File) => {
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        proofUrl = await uploadProof.mutateAsync(proofFile);
      }
      await createPayment.mutateAsync({
        amount: parseFloat(amount),
        method: "bank_transfer",
        type: dialogType as "topup" | "withdraw",
        bank_details: bankDetails,
        reference_id: bankDetails.referenceId,
        proof_url: proofUrl,
      });
      toast.success(dialogType === "topup"
        ? "Bank transfer details submitted! Your balance will update after verification."
        : "Withdrawal request submitted! Funds will be transferred after approval.");
      resetDialog();
    } catch (e: any) {
      toast.error(e.message || "Submission failed");
    }
  };

  const handleWithdrawMethodSubmit = async (details: Record<string, string>) => {
    try {
      await withdraw.mutateAsync(parseFloat(amount));
      await createPayment.mutateAsync({
        amount: parseFloat(amount),
        method: selectedMethod!,
        type: "withdraw",
        bank_details: details,
      });
      toast.success("Withdrawal request submitted! Funds will be sent after verification.");
      resetDialog();
    } catch (e: any) {
      toast.error(e.message || "Withdrawal failed");
    }
  };

  const typeConfig: Record<string, { icon: typeof Plus; color: string; sign: string }> = {
    topup: { icon: ArrowDownLeft, color: "text-green-500", sign: "+" },
    earning: { icon: TrendingUp, color: "text-green-500", sign: "+" },
    withdraw: { icon: ArrowUpRight, color: "text-red-500", sign: "-" },
    spending: { icon: TrendingDown, color: "text-red-500", sign: "-" },
  };

  const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
    pending: { icon: Clock, color: "text-yellow-500" },
    completed: { icon: CheckCircle2, color: "text-green-500" },
    rejected: { icon: XCircle, color: "text-red-500" },
  };

  const isPending = createPayment.isPending || uploadProof.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">CallGuru</span>
          </Link>
          <div className="w-16" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Balance card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-6 text-center">
            <WalletIcon className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="font-heading text-4xl font-bold text-foreground">৳{Number(balance).toFixed(2)}</p>
            <div className="flex gap-3 justify-center mt-5">
              <Button variant="hero" onClick={() => { setDialogType("topup"); setStep("amount"); }}>
                <Plus className="w-4 h-4 mr-1" /> Top Up
              </Button>
              <Button variant="heroOutline" onClick={() => { setDialogType("withdraw"); setStep("amount"); }}>
                <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total In</p>
              <p className="font-heading text-xl font-bold text-green-500">+৳{totalIn.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Out</p>
              <p className="font-heading text-xl font-bold text-red-500">-৳{totalOut.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payment Requests */}
        {paymentRequests && paymentRequests.filter((p) => p.status === "pending").length > 0 && (
          <Card className="mb-6 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentRequests.filter((p) => p.status === "pending").map((p) => {
                  const methodInfo = PAYMENT_METHODS.find((m) => m.id === p.method);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span>{methodInfo?.icon || "💳"}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{methodInfo?.name || p.method}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">৳{Number(p.amount).toFixed(2)}</p>
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm text-center py-8">Loading…</p>
            ) : !transactions?.length ? (
              <p className="text-muted-foreground text-sm text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const cfg = typeConfig[tx.type] || typeConfig.topup;
                  const Icon = cfg.icon;
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-muted ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${cfg.color}`}>
                          {cfg.sign}${Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-up / Withdraw dialog */}
      <Dialog open={!!dialogType} onOpenChange={(o) => !o && resetDialog()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "amount"
                ? dialogType === "topup" ? "Top Up Wallet" : "Withdraw Funds"
                : step === "method"
                  ? dialogType === "topup" ? "Choose Payment Method" : "Choose Withdrawal Method"
                  : dialogType === "topup" ? "Complete Payment" : "Withdrawal Details"
              }
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Amount */}
          {step === "amount" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-foreground">Amount ($)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {dialogType === "topup" && (
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((v) => (
                    <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>
                      ${v}
                    </Button>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={resetDialog}>Cancel</Button>
                <Button
                  variant="hero"
                  onClick={handleAmountNext}
                >
                  Next
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Method selection */}
          {step === "method" && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  {dialogType === "topup" ? "Top Up" : "Withdraw"}: ${parseFloat(amount).toFixed(2)}
                </Badge>
              </div>
              <PaymentMethodSelector
                selected={selectedMethod}
                onSelect={(m) => {
                  setSelectedMethod(m);
                  setStep("details");
                }}
              />
              <Button variant="ghost" className="w-full" onClick={() => setStep("amount")}>
                ← Back
              </Button>
            </div>
          )}

          {/* Step 3: Payment details */}
          {step === "details" && selectedMethod && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.icon}{" "}
                  {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name} — ${parseFloat(amount).toFixed(2)}
                </Badge>
              </div>

              {dialogType === "topup" && (
                <>
                  {(selectedMethod === "bkash" || selectedMethod === "nagad" || selectedMethod === "rocket") && (
                    <MobilePaymentForm
                      method={selectedMethod}
                      amount={parseFloat(amount)}
                      onSubmit={handleMobileSubmit}
                      isPending={isPending}
                    />
                  )}
                  {selectedMethod === "bank_transfer" && (
                    <BankTransferForm
                      amount={parseFloat(amount)}
                      onSubmit={handleBankSubmit}
                      isPending={isPending}
                    />
                  )}
                </>
              )}

              {dialogType === "withdraw" && (
                <>
                  {(selectedMethod === "bkash" || selectedMethod === "nagad" || selectedMethod === "rocket") && (
                    <MobileWithdrawForm
                      method={selectedMethod}
                      amount={parseFloat(amount)}
                      onSubmit={handleWithdrawMethodSubmit}
                      isPending={isPending || withdraw.isPending}
                    />
                  )}
                  {selectedMethod === "bank_transfer" && (
                    <BankWithdrawForm
                      amount={parseFloat(amount)}
                      onSubmit={handleWithdrawMethodSubmit}
                      isPending={isPending || withdraw.isPending}
                    />
                  )}
                </>
              )}

              {selectedMethod === "stripe" && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">Card payments coming soon!</p>
                </div>
              )}

              <Button variant="ghost" className="w-full" onClick={() => { setStep("method"); setSelectedMethod(null); }}>
                ← Change Method
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
