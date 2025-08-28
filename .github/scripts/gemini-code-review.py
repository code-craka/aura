#!/usr/bin/env python3
"""
AI Code Review Script using Google Gemini
Performs intelligent code review on changed files in a pull request.
"""

import os
import sys
import json
import requests
import subprocess
from typing import List, Dict, Any
from pathlib import Path

# Gemini API configuration
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
GEMINI_MODEL = "gemini-pro"

def get_changed_files() -> List[str]:
    """Get list of changed files from git diff."""
    try:
        # Get changed files between current HEAD and the merge-base with main/develop
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD~1"],
            capture_output=True,
            text=True,
            cwd=os.getcwd()
        )

        if result.returncode == 0:
            files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
            # Filter for code files
            code_files = []
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp')):
                    code_files.append(file)
            return code_files
        else:
            print(f"Error getting changed files: {result.stderr}")
            return []
    except Exception as e:
        print(f"Error in get_changed_files: {e}")
        return []

def read_file_content(file_path: str) -> str:
    """Read file content safely."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def call_gemini_api(prompt: str, api_key: str) -> str:
    """Call Gemini API for code review."""
    headers = {
        "Content-Type": "application/json",
    }

    data = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 2048,
        }
    }

    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                return result['candidates'][0]['content']['parts'][0]['text']
            else:
                return "No response generated from Gemini API"
        else:
            return f"API Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error calling Gemini API: {str(e)}"

def analyze_file_with_gemini(file_path: str, content: str, api_key: str) -> Dict[str, Any]:
    """Analyze a single file with Gemini AI."""
    prompt = f"""
You are an expert code reviewer. Analyze the following code file and provide constructive feedback.

File: {file_path}
Content:
{content[:4000]}... (truncated if longer)

Please provide:
1. **Overall Assessment**: Brief summary of code quality
2. **Strengths**: What the code does well
3. **Issues**: Specific problems or improvements needed
4. **Security Concerns**: Any security vulnerabilities
5. **Best Practices**: Suggestions for following coding best practices
6. **Severity**: Rate as LOW/MEDIUM/HIGH/CRITICAL

Format your response in clear sections with emojis for readability.
Be specific and actionable in your feedback.
"""

    analysis = call_gemini_api(prompt, api_key)

    return {
        "file": file_path,
        "analysis": analysis,
        "severity": "MEDIUM"  # Default, could be enhanced with more sophisticated analysis
    }

def generate_overall_summary(analyses: List[Dict[str, Any]]) -> str:
    """Generate overall summary of all file analyses."""
    total_files = len(analyses)
    high_priority = sum(1 for a in analyses if "HIGH" in a.get("analysis", "").upper() or "CRITICAL" in a.get("analysis", "").upper())

    summary = f"""## 📋 Code Review Summary

**Files Analyzed**: {total_files}
**High Priority Issues**: {high_priority}

### 🔍 Analysis Overview

"""

    for analysis in analyses:
        file_name = analysis["file"]
        severity = analysis.get("severity", "MEDIUM")

        # Extract key points from analysis
        analysis_text = analysis.get("analysis", "")
        if "HIGH" in analysis_text.upper() or "CRITICAL" in analysis_text.upper():
            severity_icon = "🔴"
        elif "MEDIUM" in analysis_text.upper():
            severity_icon = "🟡"
        else:
            severity_icon = "🟢"

        summary += f"**{severity_icon} {file_name}**\n"

        # Extract first few lines of analysis as summary
        lines = analysis_text.split('\n')[:3]
        for line in lines:
            if line.strip():
                summary += f"- {line.strip()}\n"

        summary += "\n"

    return summary

def main():
    """Main function to run the AI code review."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY environment variable not set")
        sys.exit(1)

    print("🤖 Starting AI Code Review with Gemini...")

    # Get changed files
    changed_files = get_changed_files()
    if not changed_files:
        print("ℹ️ No code files changed in this PR")
        with open(".github/scripts/review-output.md", "w") as f:
            f.write("## 🤖 AI Code Review Results\n\nℹ️ **No code files were changed in this pull request.**\n\nThe AI code review found no files to analyze.")
        return

    print(f"📁 Found {len(changed_files)} changed files:")
    for file in changed_files:
        print(f"  - {file}")

    # Analyze each file
    analyses = []
    for file_path in changed_files:
        if os.path.exists(file_path):
            print(f"🔍 Analyzing {file_path}...")
            content = read_file_content(file_path)
            if content:
                analysis = analyze_file_with_gemini(file_path, content, api_key)
                analyses.append(analysis)
            else:
                print(f"⚠️ Could not read content of {file_path}")
        else:
            print(f"⚠️ File {file_path} not found")

    # Generate comprehensive review
    review_output = "## 🤖 AI Code Review Results (Gemini)\n\n"
    review_output += f"**Analyzed {len(analyses)} files**\n\n"

    if analyses:
        # Add overall summary
        review_output += generate_overall_summary(analyses)
        review_output += "---\n\n"

        # Add detailed analysis for each file
        for analysis in analyses:
            review_output += f"## 📄 {analysis['file']}\n\n"
            review_output += analysis['analysis']
            review_output += "\n\n---\n\n"

    review_output += "*This review was generated by Google Gemini AI using advanced code analysis.*"

    # Write output to file
    output_dir = Path(".github/scripts")
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(".github/scripts/review-output.md", "w", encoding="utf-8") as f:
        f.write(review_output)

    print("✅ AI Code Review completed!")
    print(f"📝 Review saved to .github/scripts/review-output.md")

if __name__ == "__main__":
    main()
