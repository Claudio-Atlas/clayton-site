---
name: Axiom
title: AI-assisted grading feedback, inside the browser
tagline: A Chrome extension that inserts detailed, personalized feedback into student discussion replies in seconds, backed by a library audited against every assignment in the course.
order: 4
category: Chrome extension
visual: axiom
role: Designer and developer
metrics:
  - value: "5 min → 5 s"
    label: Per feedback response
  - value: "~1,000"
    label: Students reached
  - value: "165"
    label: Audited responses
stack: [JavaScript, Chrome MV3, chrome.storage, DOM/Selection APIs, Python, openpyxl]
links: []
---

## Overview

I teach an online quantitative reasoning course where students submit Excel-based discussion assignments every week. Writing thorough, consistent feedback for each submission was the most time-consuming part of grading, so I built Axiom: a Chrome extension that runs inside the university's learning platform. While replying to a student, I type `/` and a keyword (or browse by assignment), and Axiom inserts a fully formatted response, filling in details such as the student's name.

## What I built

- **The extension itself (Manifest V3):** an in-page picker with slash-command search, browse-by-assignment mode, placeholder fill-in, and insertion that works with the platform's rich-text editor (TipTap/ProseMirror).
- **An audited feedback library.** I analyzed all 14 assignment templates, including their hidden answer-key and self-checking logic, and grew the library from 114 to 165 responses, correcting dozens that pointed students to the wrong cells and documenting bugs in the templates themselves.
- **Reliability and safety fixes:** a data-loss bug that could wipe the library, doubled text insertion, keyboard capture on unrelated sites, and a privacy risk from pre-filling the previous student's name.
- **A safe update system.** New and improved responses merge into each user's library without overwriting their own edits or bringing back deleted items.
- **Better submissions.** I diagnosed why some submissions broke (unsupported spreadsheet programs, browser previews, altered templates) and turned the findings into clear feedback and course policy.

## Impact

- A typical feedback response that used to take at least 5 minutes per student now takes about 5 seconds.
- More consistent, more specific feedback, with exact cells, formulas and expected answers.
- Used with nearly 1,000 students so far.

## How it was built

Developed with AI assistance (Claude Code) for coding, testing and template analysis, with every change reviewed and approved by me.
