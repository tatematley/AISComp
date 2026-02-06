import { useState } from "react";
import "../styles/JobRecommendationCard.css";
import { apiFetch } from "../lib/api";

type SkillBreakdown = {
  skill_id: number;
  skill_name: string;
  required_level: number;
  importance_weight: number;
  proficiency_level: number;
  meets_required: boolean;
  gap: number;
  weighted_points: number;
};

type JobRecommendation = {
  rank: number;
  job_id: number;
  job_title: string;
  department: string;
  match_score: number;
  eligible: boolean;
  warnings: string;
  skills_met: number;
  skills_required: number;
  total_gap: number;
  breakdown: SkillBreakdown[];
};

type Props = {
  recommendation: JobRecommendation;
  candidateId: number;
};

// Parses Claude's raw text into styled elements
const formatAnalysis = (text: string) => {
  return text.split("\n").reduce<React.ReactElement[]>((acc, line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;

    // Bold headers like **Skill Name** or ### Skill Name
    if (/^(\*\*|#{1,3}\s)/.test(trimmed)) {
      acc.push(
        <div key={i} className="jobRecAnalysisHeader">
          {trimmed.replace(/^\*\*|\*\*$|^#{1,3}\s*/g, "")}
        </div>,
      );
    }
    // Numbered items like "1." or "1)"
    else if (/^\d+[.)]/.test(trimmed)) {
      acc.push(
        <div key={i} className="jobRecAnalysisItem">
          <span className="jobRecAnalysisNumber">
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
          <span className="jobRecAnalysisText">
            {trimmed.replace(/^\d+[.)]\s*\*?\*?/, "").replace(/\*\*$/, "")}
          </span>
        </div>,
      );
    }
    // Bullet points like "- " or "• " or "* "
    else if (/^[-•*]\s/.test(trimmed)) {
      acc.push(
        <div key={i} className="jobRecAnalysisBullet">
          <span className="jobRecAnalysisText">
            {trimmed.replace(/^[-•*]\s*\*?\*?/, "").replace(/\*\*$/, "")}
          </span>
        </div>,
      );
    }
    // Regular text
    else {
      acc.push(
        <div key={i} className="jobRecAnalysisItem">
          <span className="jobRecAnalysisText">
            {trimmed.replace(/\*\*/g, "")}
          </span>
        </div>,
      );
    }
    return acc;
  }, []);
};

export default function JobRecommendationCard({
  recommendation,
  candidateId,
}: Props) {
  const [showSkills, setShowSkills] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const {
    job_id,
    job_title,
    department,
    match_score,
    skills_met,
    skills_required,
    breakdown,
  } = recommendation;

  const strengthSkills = breakdown
    .filter((s) => s.meets_required)
    .sort((a, b) => b.importance_weight - a.importance_weight);

  const gapSkills = breakdown
    .filter((s) => !s.meets_required)
    .sort((a, b) => b.importance_weight - a.importance_weight);

  const handleAI = async () => {
    if (showAI) {
      setShowAI(false);
      return;
    }

    setShowAI(true);
    if (aiAnalysis) return;

    setLoadingAI(true);
    try {
      const res = await apiFetch(
        `/api/candidates/${candidateId}/job-recommendations/${job_id}/ai-analysis`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate analysis");
      }

      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (e) {
      setAiAnalysis("Unable to generate analysis at this time.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="jobRecCard">
      <div className="jobRecHeader">
        <div>
          <h3 className="jobRecTitle">{job_title}</h3>
          <p className="jobRecDept">{department}</p>
        </div>
        <div className="jobRecBadge">{Math.round(match_score * 100)}%</div>
      </div>

      <div className="jobRecStats">
        <span>
          Skills Ready: {skills_met}/{skills_required}
        </span>
      </div>

      {strengthSkills.length > 0 && (
        <div className="jobRecStrengths">
          <div className="jobRecStrengthLabel">Your Strengths:</div>
          <div className="jobRecSkillTags">
            {strengthSkills.slice(0, 3).map((skill) => (
              <span key={skill.skill_id} className="jobRecSkillTag strength">
                ✓ {skill.skill_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Button row */}
      <div className="jobRecButtonRow">
        <button
          className="jobRecToggle"
          onClick={() => setShowSkills(!showSkills)}
        >
          {showSkills ? "Hide Skills" : "Show Needed Skills"}
        </button>

        <button className="jobRecAiToggle" onClick={handleAI}>
          {showAI ? "Hide AI" : "AI Analysis"}
        </button>
      </div>

      {/* Skills breakdown */}
      {showSkills && (
        <div className="jobRecSkillsBox">
          {strengthSkills.length > 0 && (
            <div className="jobRecSection">
              <div className="jobRecSectionLabel">
                Skills You Have ({strengthSkills.length})
              </div>
              {strengthSkills.map((skill) => (
                <div key={skill.skill_id} className="jobRecSkillRow">
                  <span className="jobRecSkillName">{skill.skill_name}</span>
                  <span className="jobRecSkillLevel met">
                    Your Level: {skill.proficiency_level} / Required:{" "}
                    {skill.required_level}
                  </span>
                </div>
              ))}
            </div>
          )}

          {gapSkills.length > 0 && (
            <div className="jobRecSection">
              <div className="jobRecSectionLabel">
                Skills to Develop ({gapSkills.length})
              </div>
              {gapSkills.map((skill) => (
                <div key={skill.skill_id} className="jobRecSkillRow">
                  <span className="jobRecSkillName">{skill.skill_name}</span>
                  <span className="jobRecSkillLevel gap">
                    {skill.proficiency_level > 0
                      ? `Level ${skill.proficiency_level} → ${skill.required_level} needed`
                      : `Level ${skill.required_level} needed`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis - now uses formatAnalysis */}
      {showAI && (
        <div className="jobRecExplanationBox">
          <div className="jobRecExplanationLabel">AI Growth Plan</div>
          {loadingAI ? (
            <p className="jobRecExplanationText">Generating analysis...</p>
          ) : aiAnalysis ? (
            <div className="jobRecAnalysis">{formatAnalysis(aiAnalysis)}</div>
          ) : (
            <p className="jobRecExplanationText">Click to generate analysis</p>
          )}
        </div>
      )}
    </div>
  );
}
