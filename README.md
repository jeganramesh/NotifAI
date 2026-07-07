# Treecourse: Agentic AI Development for VS Code

**Treecourse** is a VS Code extension that bridges the gap between AI-generated code and your local file system. Instead of manually copy-pasting code blocks from the chat, Treecourse parses AI responses, previews changes, and allows you to apply them with a single click.

## 🚀 Features

* **Smart Parsing:** Automatically extracts file paths and code blocks from AI responses (Markdown).
* **Safe Syncing:** Built-in "Dry Run" mode to preview changes before they hit your disk.
* **Agentic Workflow:** The "Accept/Reject" gate ensures you maintain full control over your codebase.
* **Atomic Updates:** Ensures files are created or updated correctly without risking corruption.
* **Git Integration:** Automatically respects your `.gitignore` and tracks changes within your existing repository.

## 📥 How to Use

1. **Generate:** Ask any AI (ChatGPT, Claude, Copilot) for code changes.
2. **Paste:** Copy the AI response containing the `## File: path/to/file` blocks.
3. **Apply:** Run the Treecourse command (`Ctrl+Shift+P` -> `Treecourse: Apply AI Response`).
4. **Review:** Treecourse will open a preview window showing you a `diff` of the proposed changes.
5. **Sync:** Click **Accept** to write the files, or **Reject** to discard them.

## ⚙️ Extension Commands

| Command | Description |
| --- | --- |
| `treecourse.apply` | Opens a text box to paste your AI response and begins the sync process. |
| `treecourse.dryRun` | Parses the response and logs proposed changes to the console without writing files. |

## 🏗️ Architecture Flow

Treecourse follows an "Observe-Propose-Execute" loop to ensure stability.

## 🛠️ Requirements

* **VS Code:** 1.80.0 or higher.
* **Environment:** Works on Windows, macOS, and Linux.

## 📦 Getting Started for Developers

If you are looking to contribute or fork Treecourse:

1. **Clone the repo:** `git clone https://github.com/your-username/treecourse`
2. **Install dependencies:** `npm install`
3. **Run:** Press `F5` in VS Code to launch the **Extension Development Host**.

### Tips for your README:

* **Add a GIF:** If you can, record a 10-second screen capture of the extension parsing a response and the "Accept/Reject" button appearing. Visual proof is the biggest factor in VS Code extension downloads.
* **Explain the `## File:` format:** Ensure the "How to use" section explicitly shows the user the format they need to ask the AI for (e.g., *"Make sure to tell the AI: Please format your output with ## File: filename code-blocks"*).
* **Badge the Version:** Once you publish, add a "Version" and "License" badge to the top.
