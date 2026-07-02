# Example: Parser

## User Goal

Extract structured data from a configuration file.

## Naive Candidate Move

Write a custom parser with regular expressions and hand-rolled edge-case handling.

## Jerry Scan

**Type:** shell

**Claim:** Existing parsers or shell tools may already handle this file format.

**Evidence:** Check the file extension, existing dependencies, language standard libraries, and available tools such as `jq` or `yq`.

**Move:** Use a proven parser or command-line tool before writing custom parsing logic.

**Risk:** A shell tool may not be available in every runtime environment.

**Receipt:** Compare parsed output against a fixture with representative edge cases.

## Revised Move

Use the existing parser closest to the data format. If portability matters, choose a project dependency or standard library rather than a local-only command.

## Why This Is Street Smart

Parsing is a trap-rich task. If the ecosystem already owns the edge cases, reuse that work.
