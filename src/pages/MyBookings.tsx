import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyHomeBookings, useAcceptBooking, usePayAdvance, useCompleteBooking, useCancelBooking } from "@/hooks/useHomeServices";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Banknote } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "অপেক্ষমান", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "গৃহীত", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "চলমান", color: "bg-primary/15 text-primary" },
  completed: { label: "সম্পন্ন", color: "bg-green-100 text-green-800" },
  cancelled: { label: "বাতিল", color: "bg-muted text-muted-foreground" },
  disputed: { label: "বিরোধ", color: "bg-red-100 text-red-800" },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bookings, isLoading } = useMyHomeBookings();
  const acceptBooking = useAcceptBooking();
  const payAdvance = usePayAdvance();
  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-bold text-lg text-foreground">আমার বুকিং</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-10">লোড হচ্ছে...</p>
        ) : !bookings?.length ? (
          <p className="text-center text-muted-foreground py-10">কোনো বুকিং নেই</p>
        ) : (
          bookings.map((b) => {
            const isProvider = user?.id === b.provider_id;
            const isCustomer = user?.id === b.customer_id;
            const st = statusMap[b.status] || statusMap.pending;
            const price = b.final_price || b.quoted_price;

            return (
              <div key={b.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={st.color}>{st.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(b.created_at), "dd MMM yyyy")}
                  </span>
                </div>

                {b.problem_description && (
                  <p className="text-sm text-foreground">{b.problem_description}</p>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  {b.address && <p>📍 {b.address}</p>}
                  {b.phone && <p>📞 {b.phone}</p>}
                  {b.preferred_date && <p>📅 {b.preferred_date} {b.preferred_time && `• ${b.preferred_time}`}</p>}
                </div>

                {price && (
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary">৳{price}</span>
                    {b.advance_paid > 0 && (
                      <span className="text-xs text-muted-foreground">(অ্যাডভান্স: ৳{b.advance_paid})</span>
                    )}
                  </div>
                )}

                {b.status === "completed" && !b.released && b.hold_until && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                    <Clock className="w-3.5 h-3.5" />
                    পেমেন্ট হোল্ড: {format(new Date(b.hold_until), "dd MMM yyyy")} পর্যন্ত
                  </div>
                )}

                {b.released && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded p-2">
                    <CheckCircle className="w-3.5 h-3.5" /> পেমেন্ট রিলিজ হয়েছে
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {/* Provider: accept pending booking */}
                  {isProvider && b.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => acceptBooking.mutate({ bookingId: b.id, quotedPrice: price || undefined })} disabled={acceptBooking.isPending}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> গ্রহণ করুন
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelBooking.mutate(b.id)} disabled={cancelBooking.isPending}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> বাতিল
                      </Button>
                    </>
                  )}

                  {/* Customer: pay advance after accepted */}
                  {isCustomer && b.status === "accepted" && (
                    <Button size="sm" variant="hero" onClick={() => payAdvance.mutate(b.id)} disabled={payAdvance.isPending}>
                      <Banknote className="w-3.5 h-3.5 mr-1" /> ৫০% অ্যাডভান্স দিন
                    </Button>
                  )}

                  {/* Customer: confirm completion */}
                  {isCustomer && b.status === "in_progress" && (
                    <Button size="sm" variant="hero" onClick={() => completeBooking.mutate(b.id)} disabled={completeBooking.isPending}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> কাজ সম্পন্ন
                    </Button>
                  )}

                  {/* Cancel option for pending */}
                  {isCustomer && b.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => cancelBooking.mutate(b.id)} disabled={cancelBooking.isPending}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> বাতিল
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBookings;
