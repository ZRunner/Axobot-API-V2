import express from 'express';
import { postWebhookNotification } from './controler';

const router = express.Router();

router.post("/webhook/:webhook_id(\\d+)/:webhook_token(\\w+)", postWebhookNotification);

export default router;