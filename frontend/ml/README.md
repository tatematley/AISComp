# ML Recommender

This folder contains the Python script that ranks candidates for a given job based on:
- required skills + required levels
- candidate skill proficiency
- importance weights per skill
- basic filters (experience/education if enabled in the script)

## Setup

From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt

## Run
```bash
python3 ml/recommend.py --excel_path "data/Dummy_Data.xlsx" --job_id 201 --top_n 5
