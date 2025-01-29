// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { get } from "http";
import ollama from "ollama";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code-helper" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "code-helper.start",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from code-helper!");
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "DeepSeek Chat Bot",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebViewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "Deepseek-r1:7b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (error) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error: ${String(error)}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebViewContent(): string {
  return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8"/>
		<style>
			body {font-family: sans-serif; margin: 1em;}
			#prompt {width:100%; box-sizing: border-box;}
			#response { border: 1px solid black; margin-top: 1rem; padding: 0.5rem; min-height: 2rem; }
		</style>
	</head>
	<body>
		<h2>DeepSeek Chat Bot</h2>
		<textarea id="prompt" placeholder="Ask me anything..."></textarea> <br/>
		<button id="askBtn">Ask</button>
		<div id="response"></div>
	</body>

	<script>
		const vscode = acquireVsCodeApi();

		document.getElementById('askBtn').addEventListener('click', () => {
			const text = document.getElementById('prompt').value;
			vscode.postMessage({ command: 'chat', text });
		});

		window.addEventListener('message', event => {
			const {command, text} = event.data;
			if (command === 'chatResponse') {
				document.getElementById('response').innerText = text;
			}
		});
	</script>
	`;
}
