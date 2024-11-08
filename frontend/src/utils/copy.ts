export const copyCode = async (code: string, setCopySuccess: (message: string) => void) => {
    try {
        await navigator.clipboard.writeText(code);
        setCopySuccess('Code copied to clipboard.');
        setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
        console.error('Failed to copy code: ', err);
    }
}

export const copyWalletAddress = async (address: string, setCopySuccess: (message: string) => void) => {
    try {
        await navigator.clipboard.writeText(address);
        setCopySuccess('Address copied to clipboard.');
        setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
        console.error('Failed to copy address: ', err);
    }
}