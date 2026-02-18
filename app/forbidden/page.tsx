import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-full">
            <ShieldX className="w-16 h-16 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        
        <p className="text-gray-400 text-lg mb-2">
          You don't have permission to access this project.
        </p>
        
        <p className="text-gray-500 text-sm mb-8">
          Only project owners and assigned members can view this project.
          If you believe this is an error, please contact the project owner.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/projects"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            View My Projects
          </Link>
          
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
