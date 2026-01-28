import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runMLPipeline(jobId: number, topN: number = 5) {
  try {
    // Go up one level from backend folder to project root
    const projectRoot = path.join(__dirname, "../../..");
    const scriptPath = path.join(projectRoot, "frontend/ml/recommend.py");
    const dataPath = path.join(projectRoot, "data/Dummy_Data.xlsx");

    console.log(`🚀 Running ML pipeline for job ${jobId}...`);
    console.log(`📍 Project root: ${projectRoot}`);
    console.log(`📍 Script path: ${scriptPath}`);
    console.log(`📍 Data path: ${dataPath}`);

    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" --excel_path "${dataPath}" --job_id ${jobId} --top_n ${topN}`,
    );

    if (stderr && !stderr.includes("DeprecationWarning")) {
      console.error("⚠️  Python script stderr:", stderr);
    }

    const result = JSON.parse(stdout);
    console.log(
      `✅ ML pipeline complete: ${result.recommendations?.length || 0} recommendations`,
    );

    return result;
  } catch (error) {
    console.error("❌ Error running ML pipeline:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    throw new Error("Failed to generate recommendations");
  }
}
