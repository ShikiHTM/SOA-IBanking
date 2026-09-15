import express, { type Express } from 'express';
import cors from 'cors';
import config from '@/configs/app.config';
import logger from '@/utils/logger.utils';

const app: Express = express();

// configuration
app.use(cors());

app.listen(config.port, () => {
    logger.info(`Listening on https://localhost:${config.port}`);
});
