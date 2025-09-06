import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 0;

export async function GET() {
  // 1) Get total rows
  const { count, error: countErr } = await supabaseAdmin
    .from('characters')
    .select('id', { count: 'exact', head: true });

  if (countErr || !count || count <= 0) {
    return new Response(JSON.stringify({ error: countErr?.message ?? 'No rows' }), { status: 500 });
  }

  // 2) Pick a random index
  const idx = Math.floor(Math.random() * count);

  // 3) Fetch exactly that row (stable order by id)
  const { data, error } = await supabaseAdmin
    .from('characters')
    .select('*')
    .order('id', { ascending: true })
    .range(idx, idx)            // exactly one row
    .maybeSingle();

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? 'No data' }), { status: 500 });
  }

  return Response.json(data);
}
