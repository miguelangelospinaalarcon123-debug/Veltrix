
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ebzysfkzammoijybpcqm.supabase.co';

const SUPABASE_KEY = 'sb_publishable__J-UmqCjn5_AgHUKqARWsA_Vxu2Ql3V';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
