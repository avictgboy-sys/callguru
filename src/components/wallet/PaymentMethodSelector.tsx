import { PAYMENT_METHODS, PaymentMethod } from "@/hooks/usePayment";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector = ({ selected, onSelect }: Props) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-foreground">Select Payment Method</p>
    <div className="grid gap-2">
      {PAYMENT_METHODS.map((m) => (
        <button
          key={m.id}
          onClick={() => m.available && onSelect(m.id)}
          disabled={!m.available}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
            selected === m.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:border-primary/40 bg-card",
            !m.available && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-2xl">{m.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{m.name}</span>
              {!m.available && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Coming Soon</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{m.description}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default PaymentMethodSelector;
