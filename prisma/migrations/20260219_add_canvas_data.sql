-- Add canvas_data column to pm_projects for persistent Excalidraw canvas storage
ALTER TABLE pm_projects ADD canvas_data NVARCHAR(MAX) NULL;
