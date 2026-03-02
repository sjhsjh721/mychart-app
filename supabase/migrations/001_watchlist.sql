-- M4: 관심종목 테이블

-- 관심종목 그룹
CREATE TABLE watchlist_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관심종목 아이템
CREATE TABLE watchlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES watchlist_groups(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_watchlist_groups_user ON watchlist_groups(user_id);
CREATE INDEX idx_watchlist_items_group ON watchlist_items(group_id);

-- RLS 정책
ALTER TABLE watchlist_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own groups"
  ON watchlist_groups FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items in own groups"
  ON watchlist_items FOR ALL
  USING (
    group_id IN (
      SELECT id FROM watchlist_groups WHERE user_id = auth.uid()
    )
  );
