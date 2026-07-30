import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

function SignedImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    supabase.storage
      .from("job-images")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (live) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      live = false;
    };
  }, [path]);
  if (!url) return <div className="h-16 w-16 rounded-lg bg-[#F3F4F6]" />;
  return <img src={url} alt="Job photo" className="h-16 w-16 rounded-lg object-cover" />;
}

export function JobPhotoUploader({
  jobId,
  label,
  paths,
  onChange,
  disabled,
}: {
  jobId: string;
  label: string;
  paths: string[];
  onChange: (paths: string[]) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      const next = [...paths];
      for (const file of Array.from(files).slice(0, 6)) {
        const path = `${uid}/${jobId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("job-images").upload(path, file);
        if (error) throw error;
        next.push(path);
      }
      onChange(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-[#4a5563] mb-2">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {paths.map((p) => (
          <SignedImage key={p} path={p} />
        ))}
        <label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled || busy}
            onChange={(e) => upload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            asChild
          >
            <span className="cursor-pointer">
              <ImagePlus className="h-4 w-4 mr-1" />
              {busy ? "Uploading…" : "Add"}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}