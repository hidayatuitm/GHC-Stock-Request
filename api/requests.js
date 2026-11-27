import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { database, reply } from './_db.js';

function equalSecrets(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
const clean = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : '';
const sha256 = v => createHash('sha256').update(v).digest('hex');

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
  try {
    const code = process.env.STAFF_ACCESS_CODE;
    if (!code) throw new Error('Missing STAFF_ACCESS_CODE');
    const b = req.body || {};
    if (!equalSecrets(b.access_code || '', code)) return reply(res, 403, { error: 'Invalid staff access code' });

    const requester_name = clean(b.requester_name, 100);
    const requester_email = clean(b.requester_email, 150);
    const phone_number = clean(b.phone_number, 35);
    const incident_ticket_number = clean(b.incident_ticket_number, 80);
    const region = clean(b.region, 20);
    const problem_description = clean(b.problem_description, 2000);
    const remark = clean(b.remark, 500);
    const item_id = Number(b.item_id);
    const quantity_requested = Number(b.quantity_requested);

    if (!requester_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email) ||
        !phone_number || !incident_ticket_number ||
        !['Northern','Central','Southern','Eastern'].includes(region) ||
        !problem_description || !Number.isSafeInteger(item_id) || item_id <= 0 ||
        !Number.isSafeInteger(quantity_requested) || quantity_requested <= 0) {
      return reply(res, 400, { error: 'Please complete all required fields correctly' });
    }

    const db = database();
    const { data: item, error: lookupError } = await db.from('item')
      .select('quantity_available').eq('item_id', item_id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!item) return reply(res, 404, { error: 'Item not found' });
    if (quantity_requested > item.quantity_available) {
      return reply(res, 400, { error: 'Requested quantity exceeds displayed stock' });
    }

    // Generate an unpredictable, unique code. Never save the raw code in Supabase.
    const management_code = randomBytes(32).toString('hex');
    const request_access_token_hash = sha256(management_code);
    const { data, error } = await db.from('stock_request').insert({
      item_id, requester_name, requester_email, phone_number,
      incident_ticket_number, region, quantity_requested,
      problem_description, remark, request_status: 'Pending',
      request_access_token_hash
    }).select('request_id').single();
    if (error) throw error;

    // Display this one time only. API requests and responses must not be logged.
    return reply(res, 201, {
      success: true, request_id: data.request_id, status: 'Pending', management_code
    });
  } catch (err) {
    console.error('Request API failed:', err.message);
    return reply(res, 500, { error: 'Unable to save request' });
  }
}
