import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    InitializeParams,
    CompletionItemKind,
    TextDocumentSyncKind,
    CompletionParams,
    Position
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { assert } from "console";
import { findIndexStartingAt, getIndentation } from "./_utils";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const cursorPositions = new Map<string, Position>();

enum scopeType {
    Out = "out",
    MkData = "mkdata",
    Python = "python",
};

connection.onInitialize((_params: InitializeParams) => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full, // Use explicit sync kind
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ["@"],
            },
        },
    };
});

connection.onRequest('updateCursorPosition', (params: { uri: string; position: Position }) => {
    console.log("Cursor position updated for", params.uri, "to", params.position);
    cursorPositions.set(params.uri, params.position);
});

connection.onCompletion((_textDocumentPosition) => {
    console.log("Completion requested at position", _textDocumentPosition.position);
    const document_literal = documents.get(_textDocumentPosition.textDocument.uri)?.getText();
    if (!document_literal) {
        return;
    }

    const cursor_pos = _textDocumentPosition.position;
    const current_scope = getCurrentScope(document_literal, cursor_pos);
    console.log({ current_scope });

    const cur_line = document_literal.split("\n")[cursor_pos.line].substring(0, cursor_pos.character);

    if (current_scope === scopeType.Out) {
        if (cur_line.trim().startsWith("@redirect ")) {
            return [
                { label: "stdout", kind: CompletionItemKind.Constant, detail: "Redirects to stdout" },
                { label: "stderr", kind: CompletionItemKind.Constant, detail: "Redirects to stderr" },
            ];
        }
        return [
            { label: "redirect", kind: CompletionItemKind.Keyword, detail: "Syntax @redirect" },
            { label: "run", kind: CompletionItemKind.Keyword, detail: "Syntax @run" },
        ];
    }
    else if (current_scope === scopeType.MkData) {
        if (cur_line.trim().startsWith("@redirect ")) {
            return [
                { label: "stdout", kind: CompletionItemKind.Constant, detail: "Redirects to stdout" },
                { label: "stderr", kind: CompletionItemKind.Constant, detail: "Redirects to stderr" },
            ];
        }
        return [
            { label: "redirect", kind: CompletionItemKind.Keyword, detail: "Syntax @redirect" },
            { label: "run", kind: CompletionItemKind.Keyword, detail: "Syntax @run" },
            { label: "loop", kind: CompletionItemKind.Keyword, detail: "Syntax @loop" },
            { label: "for", kind: CompletionItemKind.Keyword, detail: "Syntax @for" },
            { label: "python", kind: CompletionItemKind.Keyword, detail: "Syntax @python" },
            { label: "any", kind: CompletionItemKind.Keyword, detail: "Syntax @any" },
        ];
    }
    else {
        // this will be handled by the python language server
        return [];
    }
});

connection.onCompletionResolve((item) => {
    const keywordToDocumentation: Record<string, string> = {
        redirect: "Redirects the output of the block to a file.\nUsage: @redirect <filepath: expr> | stdout | stderr",
        run: "Defines an execution scope.\nUsage: @run { ... }",
        loop: "Loops everything within the block for a number of times.\nUsage: @loop <times: expr> { ... }",
        for: "Loops everything within the block for a number of times with counter.\nUsage: @for <var: expr> in <times: expr> { ... }",
        python: "Executes a Python snippet.\nUsage: @python { ... }",
        any: "Randomly selects a block to execute.\nUsage: @any { ... }{ ... }...\nUsage: @any <weight 1> <weight 2> ... { ... }{ ... }...",
    };
    item.documentation = keywordToDocumentation[item.label];
    return item;
});

documents.onDidChangeContent((change) => {
    if (change.document.languageId != 'mkdata') {
        console.debug("Language ID of the active document is not mkdata");
        return;
    }
    const document_literal = change.document.getText();
    const uri = change.document.uri;

    // Get the latest cursor position for this document
    const cursorPosition = cursorPositions.get(uri);
    if (cursorPosition) {
        console.log(`Cursor at line ${cursorPosition.line}, character ${cursorPosition.character}`);
    }
    else {
        console.error("No cursor position found for", uri);
        return;
    }
})

function getCurrentScope(document_literal: string, cursor_pos: Position): scopeType {
    const document_lines = document_literal.split("\n");
    // identify whether the position is in the execution zone
    assert(cursor_pos.line < document_lines.length, "Cursor position out of range");
    const run_start = document_lines.findIndex((line) => line.startsWith("@run"));
    const run_end = findIndexStartingAt((line) => line.startsWith("}"), document_lines, run_start);
    console.log({ run_start, run_end, cursor_pos });
    if (!run_start || !run_end || !(
        run_start <= cursor_pos.line && cursor_pos.line <= run_end
    )) {
        return scopeType.Out;
    }
    // else the cursor is in the execution zone
    // identify the type of execution zone
    const cur_line = document_lines[cursor_pos.line].substring(0, cursor_pos.character);
    for (let i = cursor_pos.line - 1; i >= run_start; i--) {
        if (document_lines[i].trimStart().startsWith("@python") && getIndentation(document_lines[i]) < getIndentation(cur_line)) {
            return scopeType.Python;
        }
        else if (document_lines[i].trimStart().startsWith("@")) {
            break;
        }
    }
    // console.log({cur_line});
    if (cur_line.trim() === "") {
        return scopeType.MkData;
    }
    const endOfFirstWord = cur_line.match(/\S(\s|$)/)?.index! + 1 || -1;
    // console.debug({endOfFirstWord, cursor_pos});
    if (cur_line.trim().startsWith("@") && endOfFirstWord >= cursor_pos.character) {
        return scopeType.MkData;
    }
    return scopeType.Python;
}

documents.listen(connection);
connection.listen();
