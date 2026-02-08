import { useState } from "react";
import "../styles/CandidateCard.css";

type SkillBreakdown = {
  skill_name: string;
  required_level: number;
  proficiency_level: number;
  meets_required: boolean;
  importance_weight: number;
};

type Recommendation = {
  rank: number;
  candidate_id: number;
  name: string | null;
  current_role: string;
  match_score: number;
  skills_met: number;
  skills_required: number;
  breakdown: SkillBreakdown[];
  explanation?: string;
};

type Props = {
  recommendation: Recommendation;
  jobTitle: string;
  jobId: number;
};

export default function CandidateCard({
  recommendation,
  jobTitle,
  jobId,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const {
    candidate_id,
    name,
    current_role,
    match_score,
    skills_met,
    skills_required,
    breakdown,
  } = recommendation;

  const handleShowExplanation = async () => {
    // Toggle off
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }

    // Show the box
    setShowExplanation(true);

    // If we already have it, just display
    if (explanation) return;

    // Generate it on-demand
    setLoadingExplanation(true);
    try {
      const res = await fetch(
        `http://localhost:5050/api/jobs/${jobId}/recommendations/${candidate_id}/explanation`,
      );

      if (!res.ok) {
        throw new Error("Failed to generate explanation");
      }

      const data = await res.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error("Failed to load explanation:", error);
      setExplanation("Unable to generate explanation at this time.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Get top 3 matched skills to display
  const topSkills = breakdown
    .filter((s) => s.meets_required)
    .sort((a, b) => b.importance_weight - a.importance_weight)
    .slice(0, 3);

  return (
    <div className="candidateCard">
      <div className="candidateHeader">
        <div>
          <h3 className="candidateName">{name ?? `Candidate #${candidate_id}`}</h3>
          <p className="candidateRole">{current_role}</p>
        </div>
        <div className="matchBadge">{Math.round(match_score * 100)}%</div>
      </div>

      <div className="candidateStats">
        <span>
          Skills: {skills_met}/{skills_required}
        </span>
      </div>

      {topSkills.length > 0 && (
        <div className="topSkills">
          {topSkills.map((skill) => (
            <span key={skill.skill_name} className="skillTag">
              {skill.skill_name}
            </span>
          ))}
        </div>
      )}

      <div className="buttonRow">
        <button
          className="detailsToggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>

        <button className="aiToggle" onClick={handleShowExplanation}>
          {showExplanation ? "Hide AI" : "AI Analysis"}
        </button>
      </div>

      {showDetails && (
        <div className="detailsBox">
          <div className="detailsLabel">Skill Breakdown</div>
          {breakdown.slice(0, 5).map((skill) => (
            <div key={skill.skill_name} className="skillDetail">
              <span className="skillDetailName">{skill.skill_name}</span>
              <span
                className={`skillDetailStatus ${skill.meets_required ? "met" : "gap"}`}
              >
                {skill.meets_required
                  ? `✓ Lvl ${skill.proficiency_level}`
                  : `✗ Need Lvl ${skill.required_level}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {showExplanation && (
        <div className="explanationBox">
          <div className="explanationLabel">AI Analysis</div>
          <p className="explanationText">
            {loadingExplanation
              ? "Generating explanation..."
              : explanation || "Click to generate explanation"}
          </p>
        </div>
      )}
    </div>
  );
}
