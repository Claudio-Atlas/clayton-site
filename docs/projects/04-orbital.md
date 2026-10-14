# Orbital: An Automated Math-Video Pipeline

**One-line summary:** A system that turns a written math lesson into a narrated, animated video, with timing and quality checks built in.

## Overview

Making a narrated math animation by hand means hours of lining up voice with visuals and catching layout mistakes frame by frame. Orbital is the production pipeline for my YouTube channel (@orbital-solver) and a college math course I teach. I write the script and the scene. The system generates the narration, renders the animation, checks the result, and prepares the YouTube description, chapters and thumbnail.

## What I did

- Rebuilt the pipeline after the original was lost. I recovered the voice and visual style from old git history and turned past review notes into written rule books ("playbooks").
- Built a cue-based timing layer so each animation starts on the word that describes it. Every cue lands within 0.033 s of its target.
- Built a narration engine on ElevenLabs. It checks every take for garbled words (Whisper) and for pacing against a standard measured from 300 earlier takes, and it re-generates takes that fail.
- Cut review renders from about 25 minutes to about 2 by rendering sections in parallel and reusing unchanged ones.
- Added automatic checks on every render: sync, how long the screen sits still, text size, canvas use, and an overlap audit after each animation. Five AI review agents also check layout, timing, script, thumbnail and publishing.
- Wrote an AES-256 implementation, verified against the official FIPS-197 test vectors, so the encryption video shows real bytes.

## Impact

- Produced the full video library for MAT144.com: 217 videos published on the Orbital YouTube channel, which has 6,300+ subscribers.
- Covers concept explainers (functions, slope, probability, statistics, percents), step-by-step Excel walkthroughs for the course's discussion assignments, and a full problem-by-problem series for Exam 1 and Exam 2 reviews.
- Also includes upper-level math, such as Sylow theory and a proof that the real numbers are uncountable.
- Students in my MAT-144 sections use the videos alongside MAT144.com.
- The current pipeline is a rebuilt instance. The two most recent productions are an exam-review problem and an 8-minute encryption explainer.

## Links

- YouTube: https://www.youtube.com/@orbital-solver
- Product site: https://orbitalsolver.io (live, but needs updating: it still shows a "coming soon" type-a-problem product with pricing)

## Tech stack

Python 3.12, Manim, ElevenLabs API, Whisper (mlx-whisper), FFmpeg, LaTeX, FastAPI (local review app), pytest, Git/GitHub.

## How it was built

Built with Claude Code, an AI coding assistant, which wrote most of the code under my direction. I set the requirements and quality standards and reviewed every video.
