import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { normalize } from 'viem/ens';

// Base Public Client
const publicClient = createPublicClient({
    chain: base,
    transport: http()
});

/**
 * Resolves a Basename for a given address
 * @param {string} address - The Ethereum address to resolve
 * @returns {Promise<string|null>} - The Basename or null if not found
 */
export async function resolveBasename(address) {
    if (!address) return null;

    try {
        const name = await publicClient.getEnsName({
            address: address,
        });
        return name;
    } catch (error) {
        console.warn('Error resolving Basename:', error);
        return null;
    }
}

/**
 * Formats an address for display (e.g., 0x1234...5678)
 * @param {string} address 
 * @returns {string}
 */
export function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
