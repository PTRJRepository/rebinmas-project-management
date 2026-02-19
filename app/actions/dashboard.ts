'use server'

/**
 * Dashboard Actions - Using SQL Server via SQL Gateway API
 *
 * All dashboard operations now use the SQL Server database (extend_db_ptrj)
 * via the SQL Gateway API instead of local SQLite.
 */

import { sqlGateway } from '@/lib/api/sql-gateway'

export async function getDashboardStats(projectId: string) {
    try {
        // Get project with task counts
        const projectResult = await sqlGateway.query(`
            SELECT 
                p.id,
                p.name,
                COUNT(t.id) as total_tasks,
                SUM(CASE WHEN ts.name = 'Done' THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.due_date < GETDATE() AND ts.name <> 'Done' THEN 1 ELSE 0 END) as overdue_tasks
            FROM pm_projects p
            LEFT JOIN pm_tasks t ON p.id = t.project_id
            LEFT JOIN pm_task_statuses ts ON t.status_id = ts.id
            WHERE p.id = @projectId
            GROUP BY p.id, p.name
        `, { projectId })

        if (projectResult.recordset.length === 0) {
            return { success: false, error: 'Project not found' }
        }

        const project = projectResult.recordset[0]

        // Get status distribution for chart
        const statusResult = await sqlGateway.query(`
            SELECT 
                ts.name as status_name,
                COUNT(t.id) as task_count
            FROM pm_task_statuses ts
            LEFT JOIN pm_tasks t ON ts.id = t.status_id
            WHERE ts.project_id = @projectId
            GROUP BY ts.name
        `, { projectId })

        const chartData = statusResult.recordset.map((row: any) => ({
            name: row.status_name,
            value: row.task_count
        }))

        return {
            success: true,
            data: {
                totalTasks: project.total_tasks || 0,
                completedTasks: project.completed_tasks || 0,
                overdueTasks: project.overdue_tasks || 0,
                chartData
            }
        }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
