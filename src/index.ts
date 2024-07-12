import express from 'express';
import { generateAgent } from './agentGenerator';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/generate-agent', async (req, res) => {
  try {
    const { prompt } = req.body;
    const agent = await generateAgent(prompt);
    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate agent' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
