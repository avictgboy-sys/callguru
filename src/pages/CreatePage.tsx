import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePage } from "@/hooks/usePages";
import { toast } from "sonner";

const categories = ["General", "Business", "Education", "Entertainment", "Technology", "Health", "Food", "Sports", "Music", "Art"];

const CreatePage = () => {
  const navigate = useNavigate();
  const createPage = useCreatePage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Page name is required");
    try {
      await createPage.mutateAsync({ name, description, category });
      toast.success("Page created!");
      navigate("/pages");
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-2xl mx-auto">
          <Link to="/pages"><ArrowLeft className="w-5 h-5 text-foreground" /></Link>
          <h1 className="text-lg font-bold text-foreground">Create Page</h1>
        </div>
      </div>

      <div className="pt-16 pb-8 px-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader><CardTitle>New Page</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Page Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter page name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this page about?" rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={createPage.isPending}>
                {createPage.isPending ? "Creating..." : "Create Page"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePage;
