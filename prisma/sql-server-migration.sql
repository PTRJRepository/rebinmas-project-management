-- Migration Script for Project Management Tables
-- Database: extend_db_ptrj
-- Server: SERVER_PROFILE_1 (10.0.0.110:1433)
-- This script creates the schema for the Schedule Tracker Project Management system

-- ==================================================
-- TABLE: pm_users
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_users] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [username] NVARCHAR(255) NOT NULL,
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [password] NVARCHAR(255) NOT NULL,
        [name] NVARCHAR(255) NOT NULL,
        [role] NVARCHAR(50) NOT NULL DEFAULT 'MEMBER', -- ADMIN, PM, MEMBER
        [avatar_url] NVARCHAR(500) NULL,
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETDATE()
    )
    PRINT 'Table pm_users created successfully.'
END
ELSE
    PRINT 'Table pm_users already exists.'

-- ==================================================
-- TABLE: pm_projects
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_projects]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_projects] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [start_date] DATETIME NULL,
        [end_date] DATETIME NULL,
        [priority] NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
        [banner_image] NVARCHAR(500) NULL DEFAULT 'https://www.shutterstock.com/image-photo/successful-business-development-plan-path-260nw-1994345504.jpg',
        [status] NVARCHAR(20) NULL, -- Manual category: SEKARANG, RENCANA, SELESAI, or null (auto by date)
        [owner_id] NVARCHAR(255) NOT NULL,
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [fk_pm_projects_owner] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[pm_users] ([id])
    )
    PRINT 'Table pm_projects created successfully.'
END
ELSE
    PRINT 'Table pm_projects already exists.'

-- ==================================================
-- TABLE: pm_task_statuses
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_task_statuses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_task_statuses] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [order] INT NOT NULL DEFAULT 0,
        [project_id] NVARCHAR(255) NOT NULL,
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [uq_pm_task_statuses_project_name] UNIQUE ([project_id], [name]),
        CONSTRAINT [fk_pm_task_statuses_project] FOREIGN KEY ([project_id]) REFERENCES [dbo].[pm_projects] ([id]) ON DELETE CASCADE
    )
    PRINT 'Table pm_task_statuses created successfully.'
END
ELSE
    PRINT 'Table pm_task_statuses already exists.'

-- ==================================================
-- TABLE: pm_tasks
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_tasks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_tasks] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [priority] NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
        [due_date] DATETIME NULL,
        [estimated_hours] FLOAT NULL,
        [actual_hours] FLOAT NULL,
        [documentation] NVARCHAR(MAX) NULL, -- Store blocks from Novel editor (JSON string)
        [progress] INT NOT NULL DEFAULT 0, -- 0-100 percentage
        [last_alert_sent] DATETIME NULL,
        [project_id] NVARCHAR(255) NOT NULL,
        [status_id] NVARCHAR(255) NOT NULL,
        [assignee_id] NVARCHAR(255) NULL,
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [fk_pm_tasks_project] FOREIGN KEY ([project_id]) REFERENCES [dbo].[pm_projects] ([id]) ON DELETE CASCADE,
        CONSTRAINT [fk_pm_tasks_status] FOREIGN KEY ([status_id]) REFERENCES [dbo].[pm_task_statuses] ([id]),
        CONSTRAINT [fk_pm_tasks_assignee] FOREIGN KEY ([assignee_id]) REFERENCES [dbo].[pm_users] ([id])
    )
    PRINT 'Table pm_tasks created successfully.'
END
ELSE
    PRINT 'Table pm_tasks already exists.'

-- ==================================================
-- TABLE: pm_comments
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_comments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_comments] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [task_id] NVARCHAR(255) NOT NULL,
        [user_id] NVARCHAR(255) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [fk_pm_comments_task] FOREIGN KEY ([task_id]) REFERENCES [dbo].[pm_tasks] ([id]) ON DELETE CASCADE,
        CONSTRAINT [fk_pm_comments_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[pm_users] ([id])
    )
    CREATE INDEX [ix_pm_comments_task_id] ON [dbo].[pm_comments] ([task_id])
    CREATE INDEX [ix_pm_comments_user_id] ON [dbo].[pm_comments] ([user_id])
    PRINT 'Table pm_comments created successfully.'
END
ELSE
    PRINT 'Table pm_comments already exists.'

-- ==================================================
-- TABLE: pm_attachments
-- ==================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pm_attachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pm_attachments] (
        [id] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [task_id] NVARCHAR(255) NOT NULL,
        [file_name] NVARCHAR(255) NOT NULL,
        [file_url] NVARCHAR(500) NOT NULL,
        [file_type] NVARCHAR(50) NOT NULL, -- 'image', 'document'
        [file_size] INT NOT NULL, -- Size in bytes
        [created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [fk_pm_attachments_task] FOREIGN KEY ([task_id]) REFERENCES [dbo].[pm_tasks] ([id]) ON DELETE CASCADE
    )
    CREATE INDEX [ix_pm_attachments_task_id] ON [dbo].[pm_attachments] ([task_id])
    PRINT 'Table pm_attachments created successfully.'
END
ELSE
    PRINT 'Table pm_attachments already exists.'

PRINT ''
PRINT 'Migration completed successfully!'
PRINT 'Total tables: 6 (pm_users, pm_projects, pm_task_statuses, pm_tasks, pm_comments, pm_attachments)'
