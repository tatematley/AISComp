// backend/services/mlService.ts

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runMLPipeline(jobId: number, topN: number = 5) {
  try {
    const scriptPath = path.resolve(
      process.cwd(),
      "../frontend/ml/recommend.py",
    );

    const excelPath = path.resolve(process.cwd(), "../data/Dummy_Data.xlsx");

    const command = `python3 "${scriptPath}" --excel_path "${excelPath}" --job_id ${jobId} --top_n ${topN}`;

    console.log("Running:", command);

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error("Python script stderr:", stderr);
    }

    return JSON.parse(stdout);
  } catch (error) {
    console.error("Error running ML pipeline:", error);
    throw new Error("Failed to generate recommendations");
  }
}
