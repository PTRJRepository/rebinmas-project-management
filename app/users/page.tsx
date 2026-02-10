import { getUsers } from '@/app/actions/user';
import { UserList } from '@/components/users/user-list';
import { AddUserDialog } from '@/components/users/add-user-dialog';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const { users, error } = await getUsers();

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Error loading users: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h2>
                    <p className="text-muted-foreground mt-1">Manage system users and their roles.</p>
                </div>
                <AddUserDialog />
            </div>

            <UserList users={users || []} />
        </div>
    );
}
