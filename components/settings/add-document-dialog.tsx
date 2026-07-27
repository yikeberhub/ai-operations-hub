"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitDocument, submitPdfDocument } from "@/lib/actions/documents";

export function AddDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmitText = (formData: FormData) => {
    startTransition(async () => {
      const result = await submitDocument(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document added — embedding now");
        setOpen(false);
      }
    });
  };

  const handleSubmitPdf = (formData: FormData) => {
    startTransition(async () => {
      const result = await submitPdfDocument(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("PDF added — extracting and embedding now");
        setOpen(false);
        setFileName(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        Add document
      </DialogTrigger>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a knowledge base document</DialogTitle>
          <DialogDescription>
            Paste text or upload a PDF. It&apos;s automatically chunked and embedded so the
            Support Agent can cite it in answers.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text">
          <TabsList className="w-full">
            <TabsTrigger value="text">Paste text</TabsTrigger>
            <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <form action={handleSubmitText} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" rows={8} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Embedding…" : "Add document"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="pdf">
            <form action={handleSubmitPdf} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pdf-title">Title (optional)</Label>
                <Input id="pdf-title" name="title" placeholder="Defaults to file name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pdf-file">PDF file</Label>
                <label
                  htmlFor="pdf-file"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground hover:bg-muted/50"
                >
                  <FileUp className="size-5" />
                  {fileName ?? "Click to choose a PDF"}
                </label>
                <input
                  id="pdf-file"
                  name="file"
                  type="file"
                  accept="application/pdf"
                  required
                  className="sr-only"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Extracting…" : "Add document"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
