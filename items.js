import { database, reply } from './_db.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method not allowed' });
  try {
    const { data, error } = await database().from('item')
      .select('item_id,item_name,category,quantity_available').order('item_name');
    if (error) throw error;
    return reply(res, 200, { items: data });
  } catch (err) {
    console.error('Items API failed:', err.message);
    return reply(res, 500, { error: 'Unable to load items' });
  }
}
