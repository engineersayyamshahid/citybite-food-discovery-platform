// Small helpers for promotions (the real packages and prices come from GET /api/promotion-packages)
import { shortDateOnly } from '../utils/helpers';

/** From a list of promotions, the one to show on "Your promotion": running first, then upcoming */
export const currentPromotion = (list = []) =>
  list.find((p) => p.status === 'active') || list.find((p) => p.status === 'scheduled') || null;

/** "10 Oct – 17 Oct" */
export const promoRange = (p) => `${shortDateOnly(p.startDate)} – ${shortDateOnly(p.endDate)}`;
