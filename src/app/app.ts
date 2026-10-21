import express from 'express';
import { errorMiddleware } from './error.middleware';
import { validateApiRequest, validateDiscoverRequest } from './validators';
import { downloadHandler } from './download.handler';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, response) =>
  response.status(200).json({ status: 'healthy' }),
);

app.post('/', downloadHandler(validateApiRequest));

app.post('/discover', downloadHandler(validateDiscoverRequest));

app.use(errorMiddleware);
