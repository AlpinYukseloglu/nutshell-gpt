# NutshellGPT

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/AlpinYukseloglu/nutshell-gpt/pre-release-build.yml)
[![Twitter Follow](https://img.shields.io/twitter/follow/0xalpo?style=social)](https://twitter.com/0xalpo)
![License](https://img.shields.io/github/license/AlpinYukseloglu/nutshell-gpt)

## Overview
NutshellGPT is a browser extension that gives one-line summaries of PR diffs.

It passes rich diffs to ChatGPT with tailored prompts to generate concise and useful summaries of diffs for individual files to minimize the cost of context switching for reviewers.

### Features
- Plugs directly into ChatGPT
- Prompts can be tweaked
- Diff formatting is optimized for ChatGPT-readability (significantly better than just copy-pasting directly)
- Many quality of life additions and performance optimizations
## Example Usage
### Screenshot Before Summary

![Screenshot](screenshots/extension-before-summary.png?raw=true)

### Screenshot After Summary

![Screenshot](screenshots/extension-after-summary.png?raw=true)

## Installation
```
git clone https://github.com/AlpinYukseloglu/nutshell-gpt.git
cd nutshell-gpt
npm install && npm run build
```

## Loading into Chrome
1. Go to `chrome://extensions`
2. Open `Load Unpacked` on the top left
3. Pass in the `build/chromium/` directory

From this point on, you should see `Summarize changes` show up on the files page when reviewing PRs!
