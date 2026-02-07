-- =====================================================
-- Whispering Palms - Telegram Bot Database Setup
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Telegram Subscribers Table
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    
    -- Birth details for horoscope
    date_of_birth DATE,
    time_of_birth TIME,
    place_of_birth VARCHAR(255),
    
    -- Calculated zodiac
    zodiac_sign VARCHAR(20),
    
    -- Subscription status
    is_active BOOLEAN DEFAULT true,
    onboarding_step VARCHAR(50) DEFAULT 'awaiting_dob',
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Nurturing campaign tracking
    signup_date DATE DEFAULT CURRENT_DATE,
    days_since_signup INTEGER DEFAULT 0,
    last_message_sent_at TIMESTAMP WITH TIME ZONE,
    last_nurture_day INTEGER DEFAULT 0,
    
    -- Conversion tracking
    converted_to_website BOOLEAN DEFAULT false,
    conversion_date TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. Telegram Messages Log Table
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_messages_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES telegram_subscribers(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'welcome', 'horoscope', 'nurture_day_2', etc.
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_successful BOOLEAN DEFAULT true,
    error_message TEXT
);

-- =====================================================
-- 3. Daily Horoscope Content Cache Table
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_horoscope_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zodiac_sign VARCHAR(20) NOT NULL,
    horoscope_date DATE NOT NULL,
    love_prediction TEXT,
    career_prediction TEXT,
    money_prediction TEXT,
    health_prediction TEXT,
    full_horoscope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(zodiac_sign, horoscope_date)
);

-- =====================================================
-- 4. Nurturing Messages Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_nurture_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INTEGER NOT NULL UNIQUE,
    message_type VARCHAR(50) NOT NULL, -- 'soft_cta', 'emotional_trigger', 'strong_cta'
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default nurturing templates
INSERT INTO telegram_nurture_templates (day_number, message_type, message_template) VALUES
(2, 'soft_cta', E'🌿 Did you know?\n\nYour palm lines reveal answers that horoscopes cannot.\nLove, marriage, money & destiny are written in your hands.\n\n✨ Explore your palm reading here:\nhttps://whispering-palms.org'),
(4, 'emotional_trigger', E'💔 Are you feeling stuck in love or career?\n\nMany people feel this during planetary transitions.\nYour palm can explain WHY and WHAT NEXT.\n\nUpload your palm & ask your question 👇\nhttps://whispering-palms.org'),
(6, 'strong_cta', E'🔮 Limited Insight Notice\n\nFree horoscopes show trends.\nPalm reading shows YOUR exact path.\n\nUnlock your future now ✨\nhttps://whispering-palms.org'),
(10, 'reminder', E'🌙 Have the stars aligned for you?\n\nYour daily horoscope shows the energy around you.\nBut only YOUR palm reveals YOUR unique destiny.\n\n✨ Ready to discover more?\nhttps://whispering-palms.org'),
(14, 'testimonial', E'💫 Many seekers have found clarity.\n\n"Finally understood why my relationships were struggling. The palm reading changed everything." - A grateful seeker\n\nYour palm holds similar answers:\nhttps://whispering-palms.org'),
(21, 'exclusive', E'🎁 Special Message for You\n\nYou''ve been with Whispering Palms for 3 weeks now.\nAs a thank you, your first palm reading question is on us.\n\nAsk about love, career, or health:\nhttps://whispering-palms.org')
ON CONFLICT (day_number) DO NOTHING;

-- =====================================================
-- 5. Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_telegram_subs_telegram_id ON telegram_subscribers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subs_active ON telegram_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_subs_onboarding ON telegram_subscribers(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_telegram_subs_signup ON telegram_subscribers(signup_date);
CREATE INDEX IF NOT EXISTS idx_telegram_horoscope_cache_date ON telegram_horoscope_cache(horoscope_date, zodiac_sign);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_sent ON telegram_messages_log(sent_at);

-- =====================================================
-- 6. Function to Calculate Zodiac Sign
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_zodiac_sign(dob DATE)
RETURNS VARCHAR(20) AS $$
DECLARE
    month INTEGER;
    day INTEGER;
BEGIN
    month := EXTRACT(MONTH FROM dob);
    day := EXTRACT(DAY FROM dob);
    
    IF (month = 3 AND day >= 21) OR (month = 4 AND day <= 19) THEN RETURN 'aries';
    ELSIF (month = 4 AND day >= 20) OR (month = 5 AND day <= 20) THEN RETURN 'taurus';
    ELSIF (month = 5 AND day >= 21) OR (month = 6 AND day <= 20) THEN RETURN 'gemini';
    ELSIF (month = 6 AND day >= 21) OR (month = 7 AND day <= 22) THEN RETURN 'cancer';
    ELSIF (month = 7 AND day >= 23) OR (month = 8 AND day <= 22) THEN RETURN 'leo';
    ELSIF (month = 8 AND day >= 23) OR (month = 9 AND day <= 22) THEN RETURN 'virgo';
    ELSIF (month = 9 AND day >= 23) OR (month = 10 AND day <= 22) THEN RETURN 'libra';
    ELSIF (month = 10 AND day >= 23) OR (month = 11 AND day <= 21) THEN RETURN 'scorpio';
    ELSIF (month = 11 AND day >= 22) OR (month = 12 AND day <= 21) THEN RETURN 'sagittarius';
    ELSIF (month = 12 AND day >= 22) OR (month = 1 AND day <= 19) THEN RETURN 'capricorn';
    ELSIF (month = 1 AND day >= 20) OR (month = 2 AND day <= 18) THEN RETURN 'aquarius';
    ELSE RETURN 'pisces';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Trigger to Auto-Calculate Zodiac on DOB Update
-- =====================================================

CREATE OR REPLACE FUNCTION update_zodiac_sign()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.zodiac_sign := calculate_zodiac_sign(NEW.date_of_birth);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_zodiac ON telegram_subscribers;
CREATE TRIGGER trigger_update_zodiac
    BEFORE INSERT OR UPDATE OF date_of_birth
    ON telegram_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_zodiac_sign();

-- =====================================================
-- 8. Function to Update Days Since Signup
-- =====================================================

CREATE OR REPLACE FUNCTION update_subscriber_days()
RETURNS void AS $$
BEGIN
    UPDATE telegram_subscribers
    SET days_since_signup = CURRENT_DATE - signup_date
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Enable RLS
-- =====================================================

ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_horoscope_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_nurture_templates ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for bot operations)
CREATE POLICY "Service role full access - subscribers" ON telegram_subscribers
    FOR ALL USING (true);

CREATE POLICY "Service role full access - messages" ON telegram_messages_log
    FOR ALL USING (true);

CREATE POLICY "Service role full access - horoscope_cache" ON telegram_horoscope_cache
    FOR ALL USING (true);

CREATE POLICY "Service role full access - nurture_templates" ON telegram_nurture_templates
    FOR ALL USING (true);

-- =====================================================
-- Setup Complete!
-- =====================================================
