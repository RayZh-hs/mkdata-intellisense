import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('extension "mkdata" is now active');
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('mkdata');

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'mkdata') {
            updateDiagnostics(event.document, diagnosticCollection);
        }
    });

    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.languageId === 'mkdata') {
            updateDiagnostics(document, diagnosticCollection);
        }
    });

    context.subscriptions.push(diagnosticCollection);
}

function highlightErrorsForRegex(text: string, regex: RegExp, errorMessage: string, severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        const startPos = match.index;
        const endPos = match.index + match[0].length;
        console.log({ 'match': match[0], 'startPos': startPos, 'endPos': endPos, 'text': text.substring(startPos, endPos) });
        const range = new vscode.Range(
            new vscode.Position(text.substring(0, startPos).split('\n').length - 1, startPos - text.substring(0, startPos).lastIndexOf('\n') - 1),
            new vscode.Position(text.substring(0, endPos).split('\n').length - 1, endPos - text.substring(0, endPos).lastIndexOf('\n') - 1)
        );
        const diagnostic = new vscode.Diagnostic(range, errorMessage, severity);
        diagnostics.push(diagnostic);
    }
    return diagnostics;
}

function highlightErrorsForRegexWithCaptureGroups(
    text: string,
    regex: RegExp,
    errorMessageGenerator: (match: RegExpMatchArray) => string,
    highlightGroupIndex: number = 0,  // Which capture group to highlight
    severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (!match[highlightGroupIndex]) continue; // Ignore empty matches

        // Find the start and end positions of the capture group
        const fullMatchStart = match.index;
        const groupStart = text.indexOf(match[highlightGroupIndex], fullMatchStart);
        const groupEnd = groupStart + match[highlightGroupIndex].length;

        // Compute line and character positions
        const startLine = text.substring(0, groupStart).split('\n').length - 1;
        const startChar = groupStart - text.lastIndexOf('\n', groupStart - 1) - 1;
        const endChar = startChar + match[highlightGroupIndex].length;

        const range = new vscode.Range(
            new vscode.Position(startLine, startChar),
            new vscode.Position(startLine, endChar)
        );

        const diagnostic = new vscode.Diagnostic(range, errorMessageGenerator(match), severity);
        diagnostics.push(diagnostic);
    }

    return diagnostics;
}


function updateDiagnostics(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    const diagnostics: vscode.Diagnostic[] = [];

    const text = document.getText();
    // console.log({'updated-text': text});

    //: Check for unwarranted syntax outside execution scope
    const reUnwarrantedSyntax = /^@(?!redirect\b|run\b)/gm;
    diagnostics.push(...highlightErrorsForRegex(text, reUnwarrantedSyntax, 'Only @redirect and @run can be used outside the execution scope.'));

    //: Check for unknown syntax
    const reUnknownSyntax = /\s*@(?!redirect\b|run\b|python\b|loop\b|for\b|any\b)(\w*)/gm;
    diagnostics.push(
        ...highlightErrorsForRegexWithCaptureGroups(text, reUnknownSyntax, match => `Unknown syntax "@${match[1].trim()}".`, 1)
    )

    diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() { }
