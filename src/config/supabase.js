import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsmrmswrpkwtbtjhnhpw.supabase.co';
const supabaseKey = 'sb_publishable_FKdCmqvsm3yrrbr4Xm1jWg_AQoSJko3';

export const supabase = createClient(supabaseUrl, supabaseKey);
