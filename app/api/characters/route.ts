import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('search')?.trim() ?? '';

  let query = supabaseAdmin
    .from('characters')
    .select('id, character_name, image_url')
    .order('character_name', { ascending: true });

  if (q) {
    query = query.ilike('character_name', `%${q}%`);
  }

  // limit to something reasonable for the dropdown
  const { data, error } = await query.limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return Response.json(data ?? []);
}
