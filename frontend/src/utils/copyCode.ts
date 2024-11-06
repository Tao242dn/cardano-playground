export const copyCode = async (code: string, setCopySuccess: (message: string) => void) => {
    try {
        await navigator.clipboard.writeText(code);
        setCopySuccess('Code copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
        console.error('Failed to copy code: ', err);
    }
}