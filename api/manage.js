import { createHash, timingSafeEqual } from 'node:crypto';
import { database, reply } from './_db.js';

const hash = input => createHash('sha256').update(input).digest('hex');
const clean = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const columns = 'request_id,item_id,requester_name,requester_email,phone_number,incident_ticket_number,region,quantity_requested,problem_description,remark,request_date,request_status,updated_at';

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
  try {
    const b = req.body || {};
    const request_id = Number(b.request_id);
    const management_code = b.management_code;
    const action = b.action;
    if (!Number.isSafeInteger(request_id) || request_id <= 0 ||
        typeof management_code !== 'string' || !/^[a-f0-9]{64}$/.test(management_code) ||
        !['read', 'update', 'delete'].includes(action)) {
      return reply(res, 400, { error: 'Invalid request ID, management code or action' });
    }
    const db = database();
    const requestedHash = hash(management_code);
    const { data: record, error: readError } = await db.from('stock_request')
      .select(`${columns},request_access_token_hash`).eq('request_id', request_id).maybeSingle();
    if (readError) throw readError;

    // Identical 404 for unknown ID and wrong code, to avoid disclosing request existence.
    const dummyHash = Buffer.alloc(32, 0);
    const stored = record?.request_access_token_hash;
    const storedBuf = typeof stored === 'string' && /^[a-f0-9]{64}$/.test(stored)
      ? Buffer.from(stored, 'hex') : dummyHash;
    const matching = timingSafeEqual(storedBuf, Buffer.from(requestedHash, 'hex'));
    if (!record || !matching) return reply(res, 404, { error: 'Request not found or management code incorrect' });

    // Never expose token hashes or other people's records.
    const { request_access_token_hash: _secret, ...safeRecord } = record;
    if (action === 'read') return reply(res, 200, { request: safeRecord });
    if (record.request_status !== 'Pending') {
      return reply(res, 409, { error: 'Only Pending requests can be edited or deleted' });
    }

    if (action === 'update') {
      const quantity_requested = Number(b.quantity_requested);
      const problem_description = clean(b.problem_description, 2000);
      const remark = clean(b.remark, 500);
      if (!Number.isSafeInteger(quantity_requested) || quantity_requested <= 0 || !problem_description) {
        return reply(res, 400, { error: 'Enter a valid quantity and problem description' });
      }
      const { data: item, error: itemError } = await db.from('item')
        .select('quantity_available').eq('item_id', record.item_id).maybeSingle();
      if (itemError) throw itemError;
      if (!item) return reply(res, 404, { error: 'Item no longer exists' });
      if (quantity_requested > item.quantity_available) {
        return reply(res, 400, { error: 'Requested quantity exceeds available stock' });
      }
      const { data, error } = await db.from('stock_request')
        .update({ quantity_requested, problem_description, remark, updated_at: new Date().toISOString() })
        .eq('request_id', request_id)
        .eq('request_access_token_hash', requestedHash)
        .eq('request_status', 'Pending').select(columns).maybeSingle();
      if (error) throw error;
      if (!data) return reply(res, 409, { error: 'Request changed; please look it up again' });
      return reply(res, 200, { success: true, request: data });
    }

    const { data, error } = await db.from('stock_request')
      .delete().eq('request_id', request_id)
      .eq('request_access_token_hash', requestedHash)
      .eq('request_status', 'Pending').select('request_id').maybeSingle();
    if (error) throw error;
    if (!data) return reply(res, 409, { error: 'Request changed; please look it up again' });
    return reply(res, 200, { success: true, deleted_request_id: data.request_id });
  } catch (err) {
    console.error('Manage API failed:', err.message);
    return reply(res, 500, { error: 'Unable to manage request' });
  }
}
