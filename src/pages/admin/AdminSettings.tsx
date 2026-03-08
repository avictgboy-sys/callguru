import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAppSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Smartphone, Building2, Percent } from "lucide-react";
import { toast } from "sonner";

const MERCHANT_FIELDS = [
  { key: "merchant_bkash", label: "bKash Merchant Number", icon: "🟠" },
  { key: "merchant_nagad", label: "Nagad Merchant Number", icon: "🔴" },
  { key: "merchant_rocket", label: "Rocket Merchant Number", icon: "🟣" },
];

const BANK_FIELDS = [
  { key: "bank_name", label: "Bank Name" },
  { key: "bank_account_name", label: "Account Holder Name" },
  { key: "bank_account_number", label: "Account Number" },
  { key: "bank_branch", label: "Branch" },
  { key: "bank_routing", label: "Routing Number" },
];

const FEE_FIELDS = [
  { key: "min_deposit", label: "Minimum Deposit (৳)", placeholder: "100" },
  { key: "min_withdraw", label: "Minimum Withdrawal (৳)", placeholder: "1000" },
  { key: "withdraw_fee_percent", label: "Withdrawal Fee (%)", placeholder: "2" },
  { key: "call_fee_percent", label: "Call Fee (%)", placeholder: "1" },
];

const AdminSettings = () => {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => (map[s.key] = s.value));
      setValues(map);
      setDirty(new Set());
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  };

  const handleSave = async () => {
    const keys = Array.from(dirty);
    try {
      await Promise.all(keys.map((key) => updateSetting.mutateAsync({ key, value: values[key] || "" })));
      toast.success(`${keys.length} setting(s) saved`);
      setDirty(new Set());
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading settings…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage payment merchant numbers and bank details</p>
          </div>
          <Button variant="hero" disabled={dirty.size === 0 || updateSetting.isPending} onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {updateSetting.isPending ? "Saving…" : `Save Changes${dirty.size > 0 ? ` (${dirty.size})` : ""}`}
          </Button>
        </div>

        {/* Mobile Payment Merchants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-primary" />
              Mobile Payment Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MERCHANT_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span>{field.icon}</span> {field.label}
                </label>
                <Input
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bank Transfer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Bank Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BANK_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <Input
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
