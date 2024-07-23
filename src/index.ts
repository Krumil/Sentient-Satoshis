import { startAutonomousAgent } from "./agentGenerator";

async function main() {
	try {
		await startAutonomousAgent();
	} catch (error) {
		console.error("Error in main function:", error);
	}
}

main();
