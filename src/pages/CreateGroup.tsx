import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Globe, Lock, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateGroup } from "@/hooks/useGroups";
import { toast } from "sonner";

const CreateGroup = () => {
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name is required");
    try {
      await createGroup.mutateAsync({ name, description, privacy });
      toast.success("Group created!");
      navigate("/groups");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const privacyOptions = [
    { value: "public", label: "Public", desc: "Anyone can see and join", icon: Globe },
    { value: "private", label: "Private", desc: "Anyone can find, admin approves members", icon: Lock },
    { value: "secret", label: "Secret", desc: "Only members can find this group", icon: EyeOff },
  ];

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-2xl mx-auto">
          <Link to="/groups"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="text-lg font-bold text-foreground">Create Group</h1>
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader><CardTitle>New Group</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Group Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter group name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group about?" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Privacy</label>
                <div className="space-y-2">
                  {privacyOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setPrivacy(opt.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        privacy === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 ${privacy === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createGroup.isPending}>
                {createGroup.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroup;
