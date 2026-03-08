import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REASONS = [
  "Poor service quality",
  "Provider was unresponsive",
  "Incorrect billing / overcharged",
  "Inappropriate behavior",
  "Technical issues during call",
  "Other",
];

interface Props {
  callId: string;
  againstId: string;
  children?: React.ReactNode;
}

const FileDisputeDialog = ({ callId, againstId, children }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("disputes" as any).insert({
        call_id: callId,
        complainant_id: user.id,
        against_id: againstId,
        reason,
        details: details.trim() || null,
      } as any);
      if (error) throw error;
      toast.success("Dispute submitted successfully. Admin will review it.");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Dispute
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            File a Dispute
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional Details (optional)</Label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileDisputeDialog;
