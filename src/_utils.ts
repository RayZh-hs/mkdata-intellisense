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