"use client";

import { useState } from "react";
import { X, Download, FileText } from "lucide-react";
import { generatePDF } from "../lib/pdf-generator";

type UpskillPlan = {
  summary: string;
  fullPlan: string;
};

type AIGrowthPlanProps = {
  plan: UpskillPlan;
  jobTitle: string;
  employeeName: string;
};

const formatPlan = (text: string) => {
  return text
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} className="text-green-400 font-bold text-lg mt-4 mb-2">
            {trimmed}
          </div>
        );
      }

      if (/^[-•*]/.test(trimmed)) {
        return (
          <div key={i} className="text-gray-300 leading-relaxed pl-6">
            {trimmed.replace(/^[-•*]\s*/, "• ")}
          </div>
        );
      }

      if (/^(\*\*|#{1,3})/.test(trimmed) || trimmed.endsWith(":")) {
        return (
          <div
            key={i}
            className="text-slate-100 font-semibold mt-3 mb-1 tracking-tight"
          >
            {trimmed.replace(/^\*\*|\*\*$|^#{1,3}\s*/g, "")}
          </div>
        );
      }

      return (
        <div key={i} className="text-gray-300 leading-relaxed">
          {trimmed}
        </div>
      );
    })
    .filter(Boolean);
};

export function AIGrowthPlan({
  plan,
  jobTitle,
  employeeName,
}: AIGrowthPlanProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generatePDF({
        content: plan.fullPlan,
        title: `Upskilling Plan - ${jobTitle}`,
        employeeName,
        date: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-6 mb-4">
        <h3 className="text-lg font-semibold text-yellow-400 mb-3">
          AI GROWTH PLAN
        </h3>

        <p className="text-gray-300 mb-4 leading-relaxed">{plan.summary}</p>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <FileText size={18} />
          See Full Plan
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                Complete Upskilling Plan
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
                >
                  <Download size={18} />
                  {isDownloading ? "Generating..." : "Download PDF"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-4">
                <div>{formatPlan(plan.fullPlan)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
