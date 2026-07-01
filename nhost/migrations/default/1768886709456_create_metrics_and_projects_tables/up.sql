-- Projects table with handle as primary key
CREATE TABLE projects (
    project_handle TEXT PRIMARY KEY,
    owner TEXT DEFAULT NULL,
    owner_email TEXT DEFAULT NULL,
    project_website TEXT DEFAULT NULL,
    project_description TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Account-level metrics snapshots (one row per account per scrape)
CREATE TABLE account_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    project_handle TEXT NOT NULL REFERENCES projects(project_handle) ON DELETE CASCADE,
    followers BIGINT DEFAULT 0,
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    reshares BIGINT DEFAULT 0,
    content_count INT DEFAULT 0,
    posts BIGINT DEFAULT 0,
    error TEXT
);

-- Project-level aggregated metrics (one row per project per scrape)
CREATE TABLE project_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    project_handle TEXT NOT NULL REFERENCES projects(project_handle) ON DELETE CASCADE,
    total_followers BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_reshares BIGINT DEFAULT 0,
    content_count INT DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX idx_account_snapshots_scraped_at ON account_snapshots(scraped_at DESC);
CREATE INDEX idx_account_snapshots_platform_handle ON account_snapshots(platform, handle);
CREATE INDEX idx_account_snapshots_project ON account_snapshots(project_handle);
CREATE INDEX idx_project_snapshots_scraped_at ON project_snapshots(scraped_at DESC);
CREATE INDEX idx_project_snapshots_project ON project_snapshots(project_handle);

-- View for latest account metrics (most recent snapshot per platform/handle)
CREATE VIEW latest_account_metrics AS
SELECT DISTINCT ON (platform, handle)
    id,
    scraped_at,
    platform,
    handle,
    project_handle,
    followers,
    views,
    likes,
    comments,
    reshares,
    content_count,
    posts,
    error
FROM account_snapshots
ORDER BY platform, handle, scraped_at DESC;

-- View for latest project metrics (most recent snapshot per project)
CREATE VIEW latest_project_metrics AS
SELECT DISTINCT ON (project_handle)
    id,
    scraped_at,
    project_handle,
    total_followers,
    total_views,
    total_likes,
    total_comments,
    total_reshares,
    content_count
FROM project_snapshots
ORDER BY project_handle, scraped_at DESC;
