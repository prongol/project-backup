    -- ==========================================
    -- USER SESSIONS AND ACTIVITY TRACKING
    -- ==========================================

    -- Create user_sessions table to track active login sessions
    CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device TEXT NOT NULL, -- e.g., "Windows - Chrome", "iPhone 14 - Safari"
    location TEXT, -- e.g., "Kathmandu, Nepal" (can be derived from IP)
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL, -- Full user agent string for parsing
    last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_current BOOLEAN DEFAULT false
    );

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

    -- Enable RLS
    ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for user_sessions
    CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

    CREATE POLICY "System can insert sessions" ON user_sessions
    FOR INSERT WITH CHECK (true);

    CREATE POLICY "System can update sessions" ON user_sessions
    FOR UPDATE USING (true);

    -- ==========================================
    -- USER ACTIVITIES TABLE
    -- ==========================================

    -- Create user_activities table to log user actions
    CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., "Password changed", "Login from new device"
    action_type TEXT NOT NULL, -- e.g., "security", "profile", "auth", "payment"
    status TEXT NOT NULL, -- "success" or "failed"
    ip_address TEXT NOT NULL,
    location TEXT, -- Optional location info
    metadata JSONB, -- Additional data about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
    );

    -- Create indexes for faster queries
    CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON user_activities(action_type);

    -- Enable RLS
    ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for user_activities
    CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "System can insert activities" ON user_activities
    FOR INSERT WITH CHECK (true);

    -- ==========================================
    -- HELPER FUNCTIONS
    -- ==========================================

    -- Function to log user activity
    CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action TEXT,
    p_action_type TEXT,
    p_status TEXT,
    p_ip_address TEXT,
    p_location TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
    v_activity_id UUID;
    BEGIN
    INSERT INTO user_activities (
        user_id,
        action,
        action_type,
        status,
        ip_address,
        location,
        metadata
    ) VALUES (
        p_user_id,
        p_action,
        p_action_type,
        p_status,
        p_ip_address,
        p_location,
        p_metadata
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
    END;
    $$;

    -- Function to create or update session
    CREATE OR REPLACE FUNCTION upsert_user_session(
    p_user_id UUID,
    p_device TEXT,
    p_location TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_is_current BOOLEAN DEFAULT false
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
    v_session_id UUID;
    v_existing_session UUID;
    BEGIN
    -- Check if a session already exists for this device/IP combo
    SELECT id INTO v_existing_session
    FROM user_sessions
    WHERE user_id = p_user_id
        AND ip_address = p_ip_address
        AND device = p_device
        AND expires_at > NOW();

    IF v_existing_session IS NOT NULL THEN
        -- Update existing session
        UPDATE user_sessions
        SET last_active = NOW(),
            expires_at = p_expires_at,
            is_current = p_is_current
        WHERE id = v_existing_session
        RETURNING id INTO v_session_id;
    ELSE
        -- Create new session
        INSERT INTO user_sessions (
        user_id,
        device,
        location,
        ip_address,
        user_agent,
        expires_at,
        is_current
        ) VALUES (
        p_user_id,
        p_device,
        p_location,
        p_ip_address,
        p_user_agent,
        p_expires_at,
        p_is_current
        ) RETURNING id INTO v_session_id;
    END IF;
    
    RETURN v_session_id;
    END;
    $$;

    -- Function to clean up expired sessions
    CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW();
    END;
    $$;

    -- Function to logout a specific session
    CREATE OR REPLACE FUNCTION logout_session(p_session_id UUID, p_user_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
    v_deleted BOOLEAN;
    BEGIN
    DELETE FROM user_sessions
    WHERE id = p_session_id
        AND user_id = p_user_id
    RETURNING true INTO v_deleted;
    
    RETURN COALESCE(v_deleted, false);
    END;
    $$;

    -- Function to logout all sessions except current
    CREATE OR REPLACE FUNCTION logout_all_other_sessions(p_user_id UUID, p_current_session_id UUID)
    RETURNS INTEGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
    v_deleted_count INTEGER;
    BEGIN
    WITH deleted AS (
        DELETE FROM user_sessions
        WHERE user_id = p_user_id
        AND id != p_current_session_id
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;
    
    RETURN v_deleted_count;
    END;
    $$;

    -- ==========================================
    -- COMMENTS
    -- ==========================================

    COMMENT ON TABLE user_sessions IS 'Tracks active user login sessions across devices';
    COMMENT ON TABLE user_activities IS 'Logs all user activities for security and audit purposes';
    COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activities';
    COMMENT ON FUNCTION upsert_user_session IS 'Creates or updates a user session';
    COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired sessions from the database';
    COMMENT ON FUNCTION logout_session IS 'Logs out a specific session';
    COMMENT ON FUNCTION logout_all_other_sessions IS 'Logs out all sessions except the current one';
