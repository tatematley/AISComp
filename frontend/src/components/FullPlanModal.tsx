import { useState, useEffect } from "react";
import { X, Download, Loader } from "lucide-react";
import { apiFetch } from "../lib/api";
import { generatePDF } from "../lib/pdf-generator";
import "../styles/FullPlanModal.css";

type Props = {
  candidateId: number;
  jobId: number;
  jobTitle: string;
  department: string;
  employeeName: string;
  onClose: () => void;
};

// Format the analysis text
const formatAnalysis = (text: string) => {
  return text
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      // Numbered items
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} className="fullPlanNumbered">
            {trimmed}
          </div>
        );
      }
      // Bullet points
      if (/^[-•*]/.test(trimmed)) {
        return (
          <div key={i} className="fullPlanBullet">
            {trimmed.replace(/^[-•*]\s*/, "• ")}
          </div>
        );
      }
      // Bold headers - CHANGED className
      if (/^(\*\*|#{1,3})/.test(trimmed) || trimmed.endsWith(":")) {
        return (
          <div key={i} className="fullPlanSectionHeader">
            {trimmed.replace(/^\*\*|\*\*$|^#{1,3}\s*/g, "")}
          </div>
        );
      }
      // Regular text
      return (
        <div key={i} className="fullPlanText">
          {trimmed}
        </div>
      );
    })
    .filter(Boolean);
};

export function FullPlanModal({
  candidateId,
  jobId,
  jobTitle,
  department,
  employeeName,
  onClose,
}: Props) {
  const [fullPlan, setFullPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFullPlan = async () => {
      try {
        const res = await apiFetch(
          `/api/candidates/${candidateId}/job-recommendations/${jobId}/ai-full-plan`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch full plan");
        }

        const data = await res.json();
        setFullPlan(data.fullPlan);
      } catch (error) {
        console.error("Error fetching full plan:", error);
        setFullPlan("Unable to load full plan at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullPlan();
  }, [candidateId, jobId]);

  const handleDownload = async () => {
    if (!fullPlan) return;

    setDownloading(true);
    try {
      await generatePDF({
        content: fullPlan,
        title: `Upskilling Plan - ${jobTitle}`,
        employeeName,
        date: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fullPlanOverlay" onClick={onClose}>
      <div className="fullPlanModal" onClick={(e) => e.stopPropagation()}>
        {/* Header - UPDATED STRUCTURE */}
        <div className="fullPlanModalHeader">
          <div className="fullPlanHeaderLeft">
            <h2 className="fullPlanTitle">Complete Upskilling Plan</h2>
            <p className="fullPlanSubtitle">
              {jobTitle} • {department}
            </p>
          </div>
          <div className="fullPlanHeaderActions">
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="fullPlanDownloadBtn"
            >
              {downloading ? (
                <>
                  <Loader size={18} className="spinning" /> Generating...
                </>
              ) : (
                <>
                  <Download size={18} /> Download PDF
                </>
              )}
            </button>
            <button onClick={onClose} className="fullPlanCloseBtn">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="fullPlanContent">
          {loading ? (
            <div className="fullPlanLoading">
              <Loader size={32} className="spinning" />
              <p>Generating your personalized upskilling plan...</p>
            </div>
          ) : (
            <div className="fullPlanBody">{formatAnalysis(fullPlan || "")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
