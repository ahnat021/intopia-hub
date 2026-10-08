import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jaceqdsqpnnomjnlahyc.supabase.co';
const supabaseKey = 'sb_publishable_fsjsugUfWglMwB2uTGNNcw_nkCulF6c';

export const supabase = createClient(supabaseUrl, supabaseKey);
