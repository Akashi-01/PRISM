<div align="center">

# PRISM

### Prompt Refinement, Intent Structuring & Metrics

**A framework for efficient, measurable, and well-structured LLM interaction.**

[![Status](https://img.shields.io/badge/status-active%20development-blue)](#roadmap)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](#contributing)

[Overview](#overview) · [Features](#key-features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Usage](#usage) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Overview

Large Language Models are only as effective as the prompts they receive. In practice, user prompts are often vague, under-specified, or poorly structured, which leads to wasted tokens, inconsistent outputs, and repeated re-prompting.

**PRISM** addresses this by sitting between the user and the LLM. It analyzes the raw prompt, identifies the underlying intent, restructures it into a clear and complete form, and measures the improvement, so that every interaction with a model is more efficient and more predictable.

Like its namesake, PRISM takes a single beam of raw input and separates it into clear, well-defined components.

## The Problem

| Challenge | Impact |
|---|---|
| Ambiguous or incomplete prompts | Irrelevant or low-quality responses |
| Unstructured user intent | Models guess the task, constraints, and format |
| Repeated re-prompting | Higher latency and token cost |
| No objective prompt quality measurement | Improvement is subjective and hard to track |

## Key Features

- **Prompt Refinement**: Rewrites raw prompts to be clearer, more specific, and more complete without changing the user's goal.
- **Intent Structuring**: Extracts and organizes intent into well-defined components such as task, context, constraints, and desired output format.
- **Metrics & Evaluation**: Quantifies prompt quality and efficiency so improvements can be measured instead of assumed.
- **Backend Service**: A modular backend that exposes the refinement pipeline for integration into applications and workflows.

## How It Works

```
 Raw Prompt
     │
     ▼
┌──────────────────┐
│ Intent Structuring│  → Identify task, context, constraints, output format
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Prompt Refinement │  → Rewrite into a clear, complete, optimized prompt
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Metrics Engine    │  → Score the original vs. refined prompt
└────────┬─────────┘
         ▼
 Refined Prompt + Structured Intent + Quality Metrics
```

## Architecture

PRISM is organized around three cooperating stages:

1. **Intent Structuring**: parses the incoming prompt into a structured representation of what the user actually wants.
2. **Prompt Refinement**: uses that structure to produce an improved prompt ready to send to any LLM.
3. **Metrics**: evaluates the original and refined prompts to report measurable gains in clarity, completeness, and efficiency.

### Project Structure

```
PRISM/
├── backend/        # Core services: intent structuring, refinement, metrics
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Git
- <!-- TODO: add runtime, e.g. Python 3.10+ / Node.js 18+ -->
- <!-- TODO: add LLM provider access if required, e.g. an API key -->

### Installation

```bash
# Clone the repository
git clone https://github.com/Akashi-01/PRISM.git
cd PRISM/backend

# Install dependencies
# TODO: replace with your actual command, e.g.
# pip install -r requirements.txt
# npm install
```

### Configuration

Create a `.env` file in `backend/` (never commit this file):

```env
# TODO: list the variables your project needs, for example:
# LLM_API_KEY=your_api_key_here
```

### Running the Backend

```bash
# TODO: replace with your actual start command, e.g.
# python main.py
# npm start
```

## Usage

> Replace the example below with your real endpoint or function signature.

**Input**

```json
{
  "prompt": "write about dogs"
}
```

**Output**

```json
{
  "intent": {
    "task": "Write an informative article",
    "topic": "Dogs",
    "constraints": ["Unspecified length", "Unspecified audience"]
  },
  "refined_prompt": "Write a clear, engaging 500-word article about domestic dogs for a general audience, covering their history, common breeds, and care basics.",
  "metrics": {
    "clarity": 0.0,
    "completeness": 0.0,
    "efficiency": 0.0
  }
}
```

## Metrics

PRISM evaluates prompts along dimensions such as:

| Metric | Description |
|---|---|
| **Clarity** | How unambiguous the prompt is |
| **Completeness** | Whether task, context, and constraints are present |
| **Efficiency** | Information value relative to prompt length and token cost |

<!-- TODO: adjust this table to match the metrics you actually implement. -->

## Roadmap

-  Project foundation and backend scaffold
-  Intent structuring pipeline
-  Prompt refinement engine
-  Metrics and evaluation module
-  REST API documentation
-  Frontend / UI
-  Support for multiple LLM providers
-  Automated tests and CI

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

For bugs and feature requests, please open an [issue](https://github.com/Akashi-01/PRISM/issues).

## Author

**Akashi-01**
GitHub: [@Akashi-01](https://github.com/Akashi-01)

---

<div align="center">

If you find PRISM useful, consider giving it a star.

</div>

If you find PRISM useful, consider giving it a star.

</div>
