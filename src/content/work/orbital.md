---
name: Orbital
title: An automated math-video pipeline
tagline: Turns a written math lesson into a narrated, animated video, with timing and quality checks built in. It has produced 217 published lessons.
order: 1
category: AI video pipeline
visual: orbital
role: Creator, product owner and lead engineer
metrics:
  - value: "217"
    label: Videos published
  - value: "6,300+"
    label: YouTube subscribers
  - value: "350K+"
    label: Views on Shorts
stack: [Python, Manim, ElevenLabs, Whisper, FFmpeg, LaTeX, FastAPI, pytest]
links:
  - label: YouTube channel
    href: https://www.youtube.com/@orbital-solver
---

## Overview

Making a narrated math animation by hand means hours of lining up voice with visuals and catching layout mistakes frame by frame. Orbital is the production pipeline behind my YouTube channel and the full video library for the college math course I teach. I write the script and the scene. The system generates the narration, renders the animation, checks the result, and prepares the YouTube description, chapters and thumbnail.

## What I built

- **Cue-based timing.** Each animation starts on the word that describes it. Every cue lands within 0.033 s of its target.
- **A self-checking narration engine** on ElevenLabs. Every take is checked for garbled words (Whisper) and for pacing against a standard measured from 300 earlier takes, and takes that fail are regenerated.
- **Fast review renders.** Sections render in parallel and unchanged ones are reused, cutting a review render from about 25 minutes to about 2.
- **Automatic checks on every render:** sync, how long the screen sits still, text size, canvas use, and an overlap audit after each animation. Five AI review agents also check layout, timing, script, thumbnail and publishing.
- **A recovered house style.** When the original pipeline was lost, I rebuilt it, recovering the voice and visual style from old git history and turning past review notes into written rule books.
- **Real math on screen.** For an encryption explainer I wrote an AES-256 implementation, verified against the official FIPS-197 test vectors, so the video shows real bytes.

## Impact

- 217 videos published on the Orbital channel, which has grown to 6,300+ subscribers.
- 350K+ views on Orbital Shorts, led by visual proofs of the Product Rule (90K) and Integration by Parts (50K).
- The complete video library for MAT144.com: concept explainers, step-by-step Excel walkthroughs for every discussion assignment, and problem-by-problem reviews for both exams.
- Upper-level topics too, from Sylow theory to a proof that the real numbers are uncountable.

## How it was built

Built with Claude Code, which wrote most of the code under my direction. I set the requirements and quality standards and reviewed every video before it shipped.
