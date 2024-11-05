export const stripAnsiCodes = (str: string): string => {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u001b\[\d+m/g, '');
};
  