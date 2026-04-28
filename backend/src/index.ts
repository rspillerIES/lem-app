import express, { Request, Response } from 'express';
const PORT = process.env.PORT || 3001;

const app = express();

app.get('/health', (req: Request, res: Response) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
