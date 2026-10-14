# Axiom: an AI-assisted grading feedback tool for an online math course

**One-line summary:** A Chrome extension that lets me insert detailed, personalized feedback into student discussion replies in seconds. It's backed by a response library I audited against every assignment template in the course.

## Overview

I teach an online quantitative reasoning course (MAT-144) where students submit Excel-based discussion assignments every week. Writing thorough, consistent feedback for each submission was the most time-consuming part of grading, so I built Axiom: a Chrome extension that runs inside the university's learning platform. While replying to a student, I type `/` and a keyword (or browse by assignment), and Axiom inserts a fully formatted response, filling in details such as the student's name.

## What I did

- **Designed and built the extension (Manifest V3):** an in-page picker with slash-command search, browse-by-assignment mode, placeholder fill-in, and insertion that works with the platform's rich-text editor (TipTap/ProseMirror).
- **Audited and expanded the feedback library:** analyzed all 14 assignment templates, including their hidden answer-key and self-checking logic, and grew the library from 114 to 165 responses. Along the way I found and corrected dozens of responses that pointed students to the wrong cells, and documented bugs in the templates themselves.
- **Fixed reliability and safety issues in the original version:** a data-loss bug that could wipe the library, doubled text insertion, keyboard capture on unrelated sites, and a privacy risk from pre-filling the previous student's name.
- **Built a safe update system:** new and improved responses merge into each user's library without overwriting their own edits or bringing back deleted items.
- **Diagnosed submission problems:** identified why some submissions broke (unsupported spreadsheet programs, browser previews, altered templates) and turned those findings into clear feedback and course policy.
- **Set up professional version control:** a private GitHub repository with per-change commits, a changelog and versioned releases.

## Impact

- A typical feedback response that used to take at least 5 minutes per student now takes about 5 seconds.
- More consistent, more specific feedback, with exact cells, formulas and expected answers.
- Used with nearly 1,000 students so far.

## Tech

JavaScript, Chrome Extensions (MV3), `chrome.storage`, DOM/Selection APIs, Python (openpyxl) for spreadsheet analysis, Git/GitHub.

## How it was built

Developed with AI assistance (Claude Code) for coding, testing and template analysis, with every change reviewed and approved by me.
