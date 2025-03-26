import * as vscode from "vscode";
import * as path from "path";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log("mkdata intellisense extension started")
    const serverModule = context.asAbsolutePath(path.join("out", "server.js"));

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: ["--inspect=6009"] } },
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: "mkdata" }],
    };

    client = new LanguageClient("mkdataLanguageServer", "MkData Language Server", serverOptions, clientOptions);
    client.start();

    let commandCheckExtension = vscode.commands.registerCommand('extension.checkLanguage', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            console.log("Language ID of the active document is:", editor.document.languageId);
        } else {
            console.log("No active editor found");
        }
    });

    vscode.window.onDidChangeTextEditorSelection((event) => {
        if (!client) return;

        const editor = event.textEditor;
        const document = editor.document;
        
        // Only send updates for 'mkdata' files
        if (document.languageId !== 'mkdata') return;

        const cursorPosition = editor.selection.active;
        
        // Send cursor position to the server
        client.sendRequest('updateCursorPosition', {
            uri: document.uri.toString(),
            position: {
                line: cursorPosition.line,
                character: cursorPosition.character
            }
        }).catch((err) => {
            console.error('Failed to send cursor position:', err);
        });
    });

    context.subscriptions.push(
        commandCheckExtension,
    );
}

export function deactivate(): Thenable<void> | undefined {
    return client ? client.stop() : undefined;
}
