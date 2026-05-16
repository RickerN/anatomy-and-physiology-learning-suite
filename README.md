# anatomy-and-physiology-learning-suite
# Iterava Learning
### An adaptive learning suite built for the way understanding actually works

---

## What this is

I built this because I kept seeing students use AI to skip the thinking and let AI do the thinking for them. 

As a professor teaching Human Anatomy and Physiology at a community college, I see the same pattern: students use AI to generate answers, move on, and mistake completion for understanding. The result is surface-level fluency, students who can say the right words but cannot reason through what those words mean or what their downstream implications are. 

Iterava Learning is my attempt to intervene at that point.

---

## How it works

The app guides students through all six levels of Bloom's Taxonomy, moving from Remembering to Creating, using AI-generated questions that adapt in real time based on how a student thinks and answers, not just whether they get something right or wrong.

When a student submits an answer, the app evaluates the quality of their reasoning, not just the correctness of their response. If something is missing, it doesn't explain the gap, it asks a follow-up question designed to help the student discover it themselves. That follow-up is generated based on the full history of what the student has said so far, so the app always knows what's been covered and never asks about something already demonstrated.

Students can request hints, but the hint system evaluates whether a genuine attempt has been made first. If it hasn't, the app redirects the student back to the work before offering support. If the answer is fundamentally wrong rather than incomplete, the difficulty drops and the app builds toward the concept from a simpler foundation.

The experience is designed to feel less like a quiz and more like a conversation with a tutor who is actually paying attention.

---

## What's under the hood

- **React** — front end interface
- **Anthropic API** — question generation, answer evaluation, follow-up dialogue
- **Vercel** — deployment and serverless API proxy
- **Supabase** — anonymous interaction logging for research and iteration
- **Bloom's Taxonomy** — the cognitive framework structuring every level of the app

---

## Who it's built for

Second and third semester health sciences students at community colleges who are working towards admission in nursing, physician assistant, occupational therapy, and similar programs. Questions are calibrated to the content scope and difficulty level of standard two-semester anatomy and physiology textbooks commonly used in community college and university health sciences programs.

The system is discipline-agnostic by design. A&P is the starting point. Nursing, microbiology, biology, chemistry, and others are in development.

---

## Where it stands

The app is deployed and functional. A faculty usability review is scheduled for May 2026 with subject matter experts in a variety of disciplines, science and non-science alike. A student pilot is in development for Fall 2026. Dissertation research examining whether structured adaptive AI engagement produces measurable growth in student reasoning quality begins January 2028.

This is a working intervention, not a concept. Every design decision was driven by a pedagogical question, not a technical one.

---

## Try it

**Live app:** [anatomy-and-physiology-learning-sui-blue.vercel.app](https://anatomy-and-physiology-learning-sui-blue.vercel.app)

---

## About

Built by a community college professor with 13 years in higher education, currently serving as a Presidential Strategic Planning Fellow across a 12-campus system and completing a PhD in Community College Leadership.

The research question driving this work: does structured adaptive AI engagement produce measurable growth in the quality of student reasoning, and can that growth be distinguished from the surface-level fluency that AI so easily enables?

---

*Iterava Learning — iteravalearning.com*
