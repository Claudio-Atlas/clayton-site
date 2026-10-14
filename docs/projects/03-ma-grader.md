# MA Grader: Desktop Autograder for Spreadsheet Assignments

**One-line summary:** A cross-platform desktop app that grades a whole class's Excel assignments in one step and writes per-student feedback.

## Overview

Grading spreadsheet assignments by hand means opening every file and checking dozens of formulas one cell at a time. MA Grader is for instructors teaching a college math course built around Excel assignments. The instructor drops in a ZIP of submissions and picks the assignment (MA1, MA2 or MA3). The app grades every workbook, writes a graded sheet with comments for each student, and builds an instructor master sheet.

## What I did

- Built a Python grading engine (about 14,800 lines across 122 files) that checks formulas, values, formatting and charts in student workbooks.
- Wrote a formula-equivalence checker that tests a student's formula against the correct one using random inputs, so correct variations get credit and hard-coded answers don't.
- Built an Electron + React desktop interface with drag-and-drop and live grading progress.
- Added optional AI grading of the written paper against an 8-criterion rubric, using the instructor's own API key stored encrypted on their machine.
- Packaged the engine so users don't need Python, and set up GitHub Actions to build Windows and macOS installers for each release.
- Wrote an audit script that runs correct and incorrect formula variants through the graders to catch grading mistakes.

## Impact

- Used by two instructors (myself and a colleague) across our course sections.
- A batch of 20 major assignments used to take about 3 hours by hand (8–10 minutes each). It now takes about 30 seconds to grade, plus around 10 minutes of manual verification.
- Close to 800 major assignments graded so far, an estimated 100+ hours of grading time saved.

## Tech stack

Python (openpyxl, PyInstaller), Electron, React, Tailwind CSS, Vite, GitHub Actions, Anthropic Claude API

## How it was built

I designed and directed this project and wrote much of the code with an AI coding assistant (Claude).

## Checks before publishing

- Line counts are from the repo at time of writing. Recount if the code changes.
- Course details: "MAT-144" appears in the app's description and was left out here. Check whether naming the course or school is OK.
- Repo link: the GitHub repo may be private. Don't link it unless it's public.
- Impact numbers: fill in only with measured numbers.
- AI line: adjust to match how much of the work was mine.
- Screenshots: make sure none show real student names, grades or files. Use the sample workbook in `assets_templates`.

## Visuals that would help

1. A GIF of a full run: dropping in a ZIP, the progress bar filling, and the results summary.
2. Before and after: a student workbook next to the graded sheet with its comments.
3. The paper-grading screen with the rubric scores, using a sample paper.
