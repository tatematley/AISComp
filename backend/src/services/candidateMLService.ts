import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runCandidateMLPipeline(
  candidateId: number,
  topN: number = 5,
) {
  try {
    const projectRoot = path.join(__dirname, "../../..");
    const scriptPath = path.join(projectRoot, "frontend/ml/recommend.py");
    const dataPath = path.join(projectRoot, "data/Dummy_Data.xlsx");

    console.log(`🚀 Running ML pipeline for candidate ${candidateId}...`);

    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" --excel_path "${dataPath}" --candidate_id ${candidateId} --top_n ${topN}`,
    );

    if (stderr && !stderr.includes("DeprecationWarning")) {
      console.error("⚠️  Python script stderr:", stderr);
    }

    const result = JSON.parse(stdout);
    console.log(
      `✅ ML pipeline complete: ${result.recommendations?.length || 0} job recommendations`,
    );

    return result;
  } catch (error) {
    console.error("❌ Error running candidate ML pipeline:", error);
    throw new Error("Failed to generate job recommendations");
  }
}
