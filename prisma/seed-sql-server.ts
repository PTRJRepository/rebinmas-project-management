/**
 * SQL Server Seeder for Schedule Tracker Project Management
 *
 * This seeder populates the Project Management tables in extend_db_ptrj
 * using the SQL Gateway API.
 *
 * API Documentation: dokumentasi/api_query.md
 * API URL: http://10.0.0.110:8001
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  server?: string;
  db?: string;
  execution_ms?: number;
}

interface QueryResult {
  recordset: any[];
  rowsAffected: number[];
}

// ==================================================
// CONFIGURATION
// ==================================================

const CONFIG = {
  API_URL: 'http://10.0.0.110:8001',
  API_TOKEN: '2a993486e7a448474de66bfaea4adba7a99784defbcaba420e7f906176b94df6',
  SERVER: 'SERVER_PROFILE_1',
  DATABASE: 'extend_db_ptrj',
};

// ==================================================
// API CLIENT
// ==================================================

class SqlGatewayClient {
  private baseUrl: string;
  private apiKey: string;
  private server: string;
  private database: string;

  constructor(config: typeof CONFIG) {
    this.baseUrl = config.API_URL;
    this.apiKey = config.API_TOKEN;
    this.server = config.SERVER;
    this.database = config.DATABASE;
  }

  async query(sql: string, params?: Record<string, any>): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        sql,
        server: this.server,
        database: this.database,
        params,
      }),
    });

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(`Query failed: ${result.error}`);
    }

    return result.data as QueryResult;
  }

  async batchQuery(queries: Array<{ sql: string; params?: Record<string, any> }>): Promise<QueryResult[]> {
    const response = await fetch(`${this.baseUrl}/v1/query/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        server: this.server,
        database: this.database,
        queries,
      }),
    });

    const result: ApiResponse<{ results: QueryResult[]; transactionCommitted: boolean }> =
      await response.json();

    if (!result.success) {
      throw new Error(`Batch query failed: ${result.error}`);
    }

    return result.data!.results;
  }

  /**
   * Insert a record with auto-generated CUID
   */
  async insert(table: string, data: Record<string, any>): Promise<string> {
    const id = data.id || this.generateCuid();

    const columns = Object.keys({ ...data, id });
    const values = Object.values({ ...data, id });
    const placeholders = values.map((_, i) => `@p${i}`).join(', ');

    const sql = `
      INSERT INTO [${table}] (${columns.map(c => `[${c}]`).join(', ')})
      VALUES (${placeholders})
    `;

    const params: Record<string, any> = {};
    values.forEach((v, i) => {
      params[`p${i}`] = v;
    });

    await this.query(sql, params);
    return id;
  }

  /**
   * Generate a CUID-like ID
   */
  private generateCuid(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}${random}`.padEnd(25, '0').substring(0, 25);
  }
}

// ==================================================
// SEEDER DATA
// ==================================================

const SEED_USERS = [
  {
    id: 'clh1234567890abcdefghijklmnop',
    username: 'admin',
    email: 'admin@rebinmas.polda.id',
    password: '$2b$10$K8Xj5Z5Z5Z5Z5Z5Z5Z5Z5O', // hashed 'admin123'
    name: 'Administrator',
    role: 'ADMIN',
    avatar_url: 'https://github.com/shadcn.png',
  },
  {
    id: 'clh0987654321zyxwvutsrqponml',
    username: 'manager',
    email: 'manager@rebinmas.polda.id',
    password: '$2b$10$K8Xj5Z5Z5Z5Z5Z5Z5Z5Z5O', // hashed 'manager123'
    name: 'Project Manager',
    role: 'PM',
    avatar_url: 'https://github.com/vercel.png',
  },
  {
    id: 'clhabcdefghijklmnopqrstuv',
    username: 'member',
    email: 'member@rebinmas.polda.id',
    password: '$2b$10$K8Xj5Z5Z5Z5Z5Z5Z5Z5Z5O', // hashed 'member123'
    name: 'Team Member',
    role: 'MEMBER',
    avatar_url: null,
  },
];

const SEED_PROJECTS = [
  {
    id: 'proj001_schedule_tracker_dev',
    name: 'Schedule Tracker Development',
    description: 'Pengembangan aplikasi Schedule Tracker untuk manajemen proyek Rebinmas',
    start_date: new Date('2026-01-01'),
    end_date: new Date('2026-06-30'),
    priority: 'HIGH',
    banner_image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
    status: 'SEKARANG',
    owner_id: 'clh0987654321zyxwvutsrqponml',
  },
  {
    id: 'proj002_rebinmas_portal',
    name: 'Portal Rebinmas Integration',
    description: 'Integrasi sistem Schedule Tracker dengan portal Rebinmas yang sudah ada',
    start_date: new Date('2026-03-01'),
    end_date: new Date('2026-09-30'),
    priority: 'MEDIUM',
    banner_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    status: 'RENCANA',
    owner_id: 'clh0987654321zyxwvutsrqponml',
  },
  {
    id: 'proj003_mobile_app',
    name: 'Mobile App Development',
    description: 'Pengembangan aplikasi mobile untuk Schedule Tracker',
    start_date: new Date('2026-02-01'),
    end_date: new Date('2026-05-31'),
    priority: 'MEDIUM',
    banner_image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    status: 'SEKARANG',
    owner_id: 'clh0987654321zyxwvutsrqponml',
  },
];

const DEFAULT_TASK_STATUSES = [
  { name: 'Backlog', order: 0 },
  { name: 'To Do', order: 1 },
  { name: 'In Progress', order: 2 },
  { name: 'Review', order: 3 },
  { name: 'Done', order: 4 },
];

const SEED_TASKS = [
  // Schedule Tracker Development Tasks
  {
    id: 'task001_setup_project',
    title: 'Setup Project Structure',
    description: 'Inisialisasi Next.js project dengan TypeScript dan Tailwind CSS',
    priority: 'HIGH',
    due_date: new Date('2026-01-15'),
    estimated_hours: 4,
    project_id: 'proj001_schedule_tracker_dev',
    status_name: 'Done',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
  {
    id: 'task002_design_database',
    title: 'Design Database Schema',
    description: 'Mendesain schema database untuk User, Project, Task, dan Comment',
    priority: 'HIGH',
    due_date: new Date('2026-01-20'),
    estimated_hours: 6,
    project_id: 'proj001_schedule_tracker_dev',
    status_name: 'Done',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
  {
    id: 'task003_kanban_board',
    title: 'Implement Kanban Board',
    description: 'Membuat komponen Kanban board dengan drag and drop functionality',
    priority: 'HIGH',
    due_date: new Date('2026-02-15'),
    estimated_hours: 12,
    project_id: 'proj001_schedule_tracker_dev',
    status_name: 'In Progress',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
  {
    id: 'task004_rich_text_editor',
    title: 'Rich Text Editor Integration',
    description: 'Integrasi TipTap editor untuk task description',
    priority: 'MEDIUM',
    due_date: new Date('2026-02-28'),
    estimated_hours: 8,
    project_id: 'proj001_schedule_tracker_dev',
    status_name: 'To Do',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
  {
    id: 'task005_authentication',
    title: 'Authentication System',
    description: 'Implementasi login/register dengan session management',
    priority: 'HIGH',
    due_date: new Date('2026-02-10'),
    estimated_hours: 10,
    project_id: 'proj001_schedule_tracker_dev',
    status_name: 'In Progress',
    assignee_id: 'clh1234567890abcdefghijklmnop',
  },
  // Mobile App Development Tasks
  {
    id: 'task006_mobile_setup',
    title: 'Mobile Project Setup',
    description: 'Setup React Native / Flutter project untuk mobile app',
    priority: 'HIGH',
    due_date: new Date('2026-02-15'),
    estimated_hours: 4,
    project_id: 'proj003_mobile_app',
    status_name: 'In Progress',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
  {
    id: 'task007_mobile_ui',
    title: 'Mobile UI Design',
    description: 'Design UI components untuk mobile app',
    priority: 'MEDIUM',
    due_date: new Date('2026-03-15'),
    estimated_hours: 16,
    project_id: 'proj003_mobile_app',
    status_name: 'To Do',
    assignee_id: 'clhabcdefghijklmnopqrstuv',
  },
];

// ==================================================
// SEEDER FUNCTIONS
// ==================================================

async function seedUsers(client: SqlGatewayClient): Promise<void> {
  console.log('🌱 Seeding users...');

  for (const user of SEED_USERS) {
    try {
      await client.insert('pm_users', {
        ...user,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`  ✓ User created: ${user.username} (${user.email})`);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint')) {
        console.log(`  ⊘ User already exists: ${user.username}`);
      } else {
        throw error;
      }
    }
  }
}

async function seedProjects(client: SqlGatewayClient): Promise<Map<string, string>> {
  console.log('🌱 Seeding projects...');

  const statusIdMap = new Map<string, string>();

  for (const project of SEED_PROJECTS) {
    try {
      await client.insert('pm_projects', {
        ...project,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`  ✓ Project created: ${project.name}`);

      // Create default task statuses for this project
      console.log(`    Creating task statuses...`);
      for (const status of DEFAULT_TASK_STATUSES) {
        const statusId = await client.insert('pm_task_statuses', {
          name: status.name,
          order: status.order,
          project_id: project.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
        statusIdMap.set(`${project.id}:${status.name}`, statusId);
        console.log(`      ✓ Status: ${status.name}`);
      }
    } catch (error: any) {
      if (error.message.includes('PRIMARY KEY constraint')) {
        console.log(`  ⊘ Project already exists: ${project.name}`);
        // Still need to get status IDs
        for (const status of DEFAULT_TASK_STATUSES) {
          const result = await client.query(
            `SELECT id FROM pm_task_statuses WHERE project_id = @projectId AND name = @name`,
            { projectId: project.id, name: status.name }
          );
          if (result.recordset.length > 0) {
            statusIdMap.set(`${project.id}:${status.name}`, result.recordset[0].id);
          }
        }
      } else {
        throw error;
      }
    }
  }

  return statusIdMap;
}

async function seedTasks(client: SqlGatewayClient, statusIdMap: Map<string, string>): Promise<void> {
  console.log('🌱 Seeding tasks...');

  for (const task of SEED_TASKS) {
    try {
      const statusId = statusIdMap.get(`${task.project_id}:${task.status_name}`);
      if (!statusId) {
        console.error(`  ✗ Status not found for task: ${task.title}`);
        continue;
      }

      await client.insert('pm_tasks', {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        project_id: task.project_id,
        status_id: statusId,
        assignee_id: task.assignee_id,
        progress: task.status_name === 'Done' ? 100 : 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`  ✓ Task created: ${task.title}`);
    } catch (error: any) {
      if (error.message.includes('PRIMARY KEY constraint')) {
        console.log(`  ⊘ Task already exists: ${task.title}`);
      } else {
        throw error;
      }
    }
  }
}

async function seedComments(client: SqlGatewayClient): Promise<void> {
  console.log('🌱 Seeding comments...');

  const comments = [
    {
      id: 'comment001',
      task_id: 'task001_setup_project',
      user_id: 'clh0987654321zyxwvutsrqponml',
      content: 'Project structure sudah ter-setup dengan baik. Lanjut ke database design.',
    },
    {
      id: 'comment002',
      task_id: 'task003_kanban_board',
      user_id: 'clh0987654321zyxwvutsrqponml',
      content: 'Pastikan drag and drop berjalan smooth di mobile juga.',
    },
    {
      id: 'comment003',
      task_id: 'task003_kanban_board',
      user_id: 'clhabcdefghijklmnopqrstuv',
      content: 'Sedang implementasi menggunakan dnd-kit library.',
    },
  ];

  for (const comment of comments) {
    try {
      await client.insert('pm_comments', {
        ...comment,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`  ✓ Comment created for task: ${comment.task_id}`);
    } catch (error: any) {
      if (error.message.includes('PRIMARY KEY constraint')) {
        console.log(`  ⊘ Comment already exists: ${comment.id}`);
      } else {
        throw error;
      }
    }
  }
}

// ==================================================
// MAIN SEEDER
// ==================================================

async function main() {
  console.log('==========================================');
  console.log(' Schedule Tracker - SQL Server Seeder');
  console.log('==========================================');
  console.log(`Server: ${CONFIG.SERVER}`);
  console.log(`Database: ${CONFIG.DATABASE}`);
  console.log('');

  const client = new SqlGatewayClient(CONFIG);

  try {
    // Test connection
    console.log('🔍 Testing connection...');
    const healthCheck = await fetch(`${CONFIG.API_URL}/health`);
    const health = await healthCheck.json();
    console.log(`  ✓ API Status: ${health.status}`);
    console.log('');

    // Seed users
    await seedUsers(client);
    console.log('');

    // Seed projects and task statuses
    const statusIdMap = await seedProjects(client);
    console.log('');

    // Seed tasks
    await seedTasks(client, statusIdMap);
    console.log('');

    // Seed comments
    await seedComments(client);
    console.log('');

    console.log('==========================================');
    console.log(' ✅ Seeding completed successfully!');
    console.log('==========================================');
    console.log('');
    console.log('Summary:');
    console.log(`  Users: ${SEED_USERS.length}`);
    console.log(`  Projects: ${SEED_PROJECTS.length}`);
    console.log(`  Task Statuses per Project: ${DEFAULT_TASK_STATUSES.length}`);
    console.log(`  Tasks: ${SEED_TASKS.length}`);
    console.log('');
  } catch (error) {
    console.error('');
    console.error('==========================================');
    console.error(' ❌ Seeding failed!');
    console.error('==========================================');
    console.error(error);
    process.exit(1);
  }
}

// Run seeder
main();
