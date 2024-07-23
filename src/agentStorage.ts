import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(__dirname, 'agentStorage');

export async function storeAgent(agentId: string, agentData: string): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const filePath = path.join(STORAGE_DIR, `${agentId}.json`);
    await fs.writeFile(filePath, agentData);
}

export async function getAgent(agentId: string): Promise<string | null> {
    const filePath = path.join(STORAGE_DIR, `${agentId}.json`);
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null; // Agent not found
        }
        throw error; // Re-throw other errors
    }
}
