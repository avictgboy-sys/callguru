import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletTransactions, useTopUp, useWithdraw } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Video, ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Wallet = () => {
  const { profile } = useAuth();
  const { data: transactions, isLoading } = useWalletTransactions();
  const topUp = useTopUp();
  const withdraw = useWithdraw();

  const [dialogType, setDialogType] = useState<"topup" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");

  const balance = profile?.wallet_balance ?? 0;

  const totalIn = transactions
    ?.filter((t) => t.type === "topup" || t.type === "earning")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalOut = transactions
    ?.filter((t) => t.type === "withdraw" || t.type === "spending")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      if (dialogType === "topup") {
        await topUp.mutateAsync(val);
        toast.success(`$${val.toFixed(2)} added to wallet`);
      } else {
        await withdraw.mutateAsync(val);
        toast.success(`$${val.toFixed(2)} withdrawn`);
      }
      setDialogType(null);
      setAmount("");
    } catch (e: any) {
      toast.error(e.message || "Transaction failed");
    }
  };

  const typeConfig: Record<string, { icon: typeof Plus; color: string; sign: string }> = {
    topup: { icon: ArrowDownLeft, color: "text-green-500", sign: "+" },
    earning: { icon: TrendingUp, color: "text-green-500", sign: "+" },
    withdraw: { icon: ArrowUpRight, color: "text-red-500", sign: "-" },
    spending: { icon: TrendingDown, color: "text-red-500", sign: "-" },
  };

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
            <p className="font-heading text-4xl font-bold text-foreground">${Number(balance).toFixed(2)}</p>
            <div className="flex gap-3 justify-center mt-5">
              <Button variant="hero" onClick={() => setDialogType("topup")}>
                <Plus className="w-4 h-4 mr-1" /> Top Up
              </Button>
              <Button variant="heroOutline" onClick={() => setDialogType("withdraw")}>
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
              <p className="font-heading text-xl font-bold text-green-500">+${totalIn.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Out</p>
              <p className="font-heading text-xl font-bold text-red-500">-${totalOut.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

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
      <Dialog open={!!dialogType} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogType === "topup" ? "Top Up Wallet" : "Withdraw Funds"}</DialogTitle>
          </DialogHeader>
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={topUp.isPending || withdraw.isPending}
            >
              {topUp.isPending || withdraw.isPending ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
