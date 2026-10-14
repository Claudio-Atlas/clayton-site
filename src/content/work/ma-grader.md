---
name: MA Grader
title: A desktop autograder for spreadsheet assignments
tagline: A cross-platform desktop app that grades a whole class's Excel assignments in one step and writes per-student feedback.
order: 3
category: Desktop app
visual: grader
role: Designer and lead engineer
metrics:
  - value: "~3 hr → 10 min"
    label: Per batch of 20
  - value: "~800"
    label: Assignments graded
  - value: "100+ hr"
    label: Grading time saved
stack: [Python, openpyxl, Electron, React, Tailwind, Vite, GitHub Actions, Claude API]
links: []
---

## Overview

Grading spreadsheet assignments by hand means opening every file and checking dozens of formulas one cell at a time. MA Grader is for instructors teaching a college math course built around Excel assignments. The instructor drops in a ZIP of submissions and picks the assignment. The app grades every workbook, writes a graded sheet with comments for each student, and builds an instructor master sheet.

## What I built

- **A Python grading engine** (about 14,800 lines across 122 files) that checks formulas, values, formatting and charts in student workbooks.
- **A formula-equivalence checker** that tests a student's formula against the correct one using random inputs, so correct variations get credit and hard-coded answers don't.
- **An Electron + React desktop interface** with drag-and-drop and live grading progress.
- **Optional AI grading** of the written paper against an 8-criterion rubric, using the instructor's own API key stored encrypted on their machine.
- **One-click installers.** The engine is packaged so users don't need Python, and GitHub Actions builds Windows and macOS installers for each release.
- **A grading audit** that runs correct and incorrect formula variants through the graders to catch grading mistakes.

## Impact

- A batch of 20 major assignments used to take about 3 hours by hand (8–10 minutes each). It now takes about 30 seconds to grade, plus around 10 minutes of manual verification.
- Close to 800 major assignments graded so far, an estimated 100+ hours of grading time saved.
- Used by two instructors across our course sections.

## How it was built

I designed and directed this project and wrote much of the code with an AI coding assistant (Claude).
