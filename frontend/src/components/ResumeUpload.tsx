import { useState, useCallback } from "react";
import { apiFetch } from "../lib/api";

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  skills: { skill_name: string; proficiency_level: number | null }[];
};

type Props = {
  onParsed: (data: ParsedResume) => void;
};

export default function ResumeUpload({ onParsed }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Resume parsing failed.");
        }

        const data = (await res.json()) as ParsedResume;
        onParsed(data);
        setUploadedFileName(file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Resume parsing failed.");
      } finally {
        setUploading(false);
      }
    },
    [onParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="resumeUploadZone">
      {uploadedFileName ? (
        <div className="resumeUploadAttached">
          <span className="resumeUploadAttachedIcon">&#10003;</span>
          <span className="resumeUploadAttachedName">{uploadedFileName}</span>
          <button
            className="resumeUploadChangeBtn"
            type="button"
            onClick={() => setUploadedFileName(null)}
          >
            Change
          </button>
        </div>
      ) : (
        <div
          className={`resumeUploadDropArea${dragOver ? " resumeUploadDropArea--over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            className="resumeUploadInput"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            disabled={uploading}
          />

          <div className="resumeUploadContent">
            {uploading ? (
              <span className="resumeUploadStatus">Parsing resume…</span>
            ) : (
              <>
                <span className="resumeUploadIcon">&#8593;</span>
                <span className="resumeUploadLabel">
                  Drop a PDF resume here, or{" "}
                  <span className="resumeUploadBrowse">browse</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {error && <div className="resumeUploadError">{error}</div>}
    </div>
  );
}
