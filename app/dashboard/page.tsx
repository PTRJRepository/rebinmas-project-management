import { redirect } from 'next/navigation';

export default function DashboardPage() {
    // For now, redirect to projects page
    // We'll build the full dashboard later
    redirect('/projects');
}
