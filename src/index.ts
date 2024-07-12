import express from 'express';
import { generateAgent } from './agentGenerator';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/generate-agent', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await generateAgent(prompt);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
