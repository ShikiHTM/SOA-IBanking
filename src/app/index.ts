import express, { type Express } from 'express';
import cors from 'cors';
import config from '@/configs/app.config';

const app: Express = express();

// configuration
app.use(cors());

app.listen(config.port, () => {
    console.log(`Listening on https://localhost:${config.port}`);
});
