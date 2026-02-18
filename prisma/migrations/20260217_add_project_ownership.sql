-- ==================================================
-- Migration: Add Project Ownership System
-- Date: 2026-02-17
-- Description: Creates pm_project_members table for ownership-based access control
-- ==================================================

-- Create project members table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pm_project_members')
BEGIN
    CREATE TABLE pm_project_members (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        joined_at DATETIME DEFAULT GETDATE(),
        added_by VARCHAR(255),
        CONSTRAINT fk_pm_members_project FOREIGN KEY (project_id) 
            REFERENCES pm_projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_members_user FOREIGN KEY (user_id) 
            REFERENCES pm_users(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_members_added_by FOREIGN KEY (added_by) 
            REFERENCES pm_users(id) ON DELETE SET NULL,
        CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
    );
    
    PRINT 'Table pm_project_members created successfully';
END
ELSE
BEGIN
    PRINT 'Table pm_project_members already exists';
END
GO

-- Add indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pm_members_project' AND object_id = OBJECT_ID('pm_project_members'))
BEGIN
    CREATE INDEX idx_pm_members_project ON pm_project_members(project_id);
    PRINT 'Index idx_pm_members_project created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pm_members_user' AND object_id = OBJECT_ID('pm_project_members'))
BEGIN
    CREATE INDEX idx_pm_members_user ON pm_project_members(user_id);
    PRINT 'Index idx_pm_members_user created';
END
GO

-- Add created_by column to pm_projects if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('pm_projects') AND name = 'created_by')
BEGIN
    ALTER TABLE pm_projects ADD created_by VARCHAR(255);
    PRINT 'Column created_by added to pm_projects';
END
GO

-- Add foreign key constraint for created_by
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_projects_created_by')
BEGIN
    ALTER TABLE pm_projects ADD CONSTRAINT fk_projects_created_by 
        FOREIGN KEY (created_by) REFERENCES pm_users(id) ON DELETE SET NULL;
    PRINT 'Foreign key fk_projects_created_by added';
END
GO

-- ==================================================
-- BACKFILL: Migrate existing owners to pm_project_members
-- ==================================================

-- Insert existing owners as OWNER in members table
INSERT INTO pm_project_members (id, project_id, user_id, role, joined_at)
SELECT 
    'pm_' + CONVERT(VARCHAR(255), NEWID()) as id,
    p.id as project_id,
    p.owner_id as user_id,
    'OWNER' as role,
    ISNULL(p.created_at, GETDATE()) as joined_at
FROM pm_projects p
WHERE p.owner_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM pm_project_members pm 
    WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
);

PRINT 'Backfill completed: Existing owners added to pm_project_members';
GO

-- Update existing records to set created_by = owner_id
UPDATE pm_projects 
SET created_by = owner_id 
WHERE created_by IS NULL AND owner_id IS NOT NULL;

PRINT 'Backfill completed: created_by set for existing projects';
GO

-- ==================================================
-- VERIFICATION
-- ==================================================

-- Show summary
SELECT 
    'Total Projects' as metric,
    COUNT(*) as value
FROM pm_projects
UNION ALL
SELECT 
    'Projects with owner_id' as metric,
    COUNT(*) as value
FROM pm_projects WHERE owner_id IS NOT NULL
UNION ALL
SELECT 
    'Project Members (Owners)' as metric,
    COUNT(*) as value
FROM pm_project_members WHERE role = 'OWNER'
UNION ALL
SELECT 
    'Total Project Members' as metric,
    COUNT(*) as value
FROM pm_project_members;

PRINT 'Migration completed successfully!';
GO
