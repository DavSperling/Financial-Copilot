CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    request_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_email_created_at ON rate_limit_tracking (email, created_at);
