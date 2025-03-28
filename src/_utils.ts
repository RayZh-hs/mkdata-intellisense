import * as lsp from 'vscode-languageserver';

export const findIndexStartingAt = <T>(predicate: (e: T) => boolean, array: T[], startFrom: number): number => {
    for (let i = startFrom; i < array.length; i++) {
        if (!array[i]) continue;
        if (predicate(array[i])) {
            return i;
        }
    }
    return -1;
};

export const getIndentation = (line: string): number => {
    return line.length - line.trimStart().length;
}

export function buildDiagnosticsWithRegex(
    text: string,
    regex: RegExp,
    errorMessageGenerator: string | ((match: RegExpMatchArray) => string),
    highlightGroupIndex: number = 0,  // Which capture group to highlight
    severity: lsp.DiagnosticSeverity = lsp.DiagnosticSeverity.Error
): lsp.Diagnostic[] {
    const diagnostics: lsp.Diagnostic[] = [];
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

        const range = lsp.Range.create(
            lsp.Position.create(startLine, startChar),
            lsp.Position.create(startLine, endChar)
        );

        const diagnostic = lsp.Diagnostic.create(range,
            typeof(errorMessageGenerator) === 'string' ? errorMessageGenerator : errorMessageGenerator(match),
            severity);
        diagnostics.push(diagnostic);
    }

    return diagnostics;
}

export function buildDiagnosisAdvanced(
    textByLine: string[],
    matchLineByRegex: RegExp,
    diagnosisGenerator: (curLine: string, pos: lsp.Position) => { range?: lsp.Range, message: string, severity?: lsp.DiagnosticSeverity } | null,
    stopAtFind: boolean = false
): lsp.Diagnostic[] {
    const diagnostics: lsp.Diagnostic[] = [];
    for (let i = 0; i < textByLine.length; i++) {
        const curLine = textByLine[i];
        let match;
        while ((match = matchLineByRegex.exec(curLine)) !== null) {
            const pos = lsp.Position.create(i, match.index);
            const diagnosis = diagnosisGenerator(curLine, pos);
            if (diagnosis) {
                if (!diagnosis.range) {
                    diagnosis.range = lsp.Range.create(pos, lsp.Position.create(pos.line, pos.character + match[0].length));
                }
                if (!diagnosis.severity) {
                    diagnosis.severity = lsp.DiagnosticSeverity.Error;
                }
                diagnostics.push(lsp.Diagnostic.create(diagnosis.range, diagnosis.message, diagnosis.severity));
                if (stopAtFind) {
                    break;
                }
            }
        }
    }
    return diagnostics;
}