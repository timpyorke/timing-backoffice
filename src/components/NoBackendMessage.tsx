import React from 'react';
import { AlertCircle, Server, Code } from 'lucide-react';

const NoBackendMessage: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-orange-500 mb-4">
        <Server className="h-24 w-24" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Backend API Required</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        The mock data has been removed. You need to start a backend API server to see real data.
      </p>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
          <span className="font-medium text-orange-800">Quick Setup:</span>
        </div>
        <ol className="text-left text-sm text-orange-700 space-y-1">
          <li>1. Start your API server on <code className="bg-orange-100 px-1 rounded">http://localhost:8000</code></li>
          <li>2. Implement the required endpoints (see API_REQUIREMENTS.md)</li>
          <li>3. Refresh this page</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry Connection
        </button>
        <a
          href="https://localhost:3002/API_REQUIREMENTS.md"
          className="btn-secondary flex items-center space-x-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Code className="h-4 w-4" />
          <span>View API Docs</span>
        </a>
      </div>

      <details className="mt-6 text-left max-w-2xl mx-auto">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
          Required API Endpoints
        </summary>
        <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono">
          <div className="space-y-1">
            <div><span className="text-green-600">GET</span> /admin/orders</div>
            <div><span className="text-blue-600">PUT</span> /admin/orders/:id/status</div>
            <div><span className="text-green-600">GET</span> /admin/menu</div>
            <div><span className="text-yellow-600">POST</span> /admin/menu</div>
            <div><span className="text-blue-600">PUT</span> /admin/menu/:id</div>
            <div><span className="text-red-600">DELETE</span> /admin/menu/:id</div>
            <div><span className="text-green-600">GET</span> /admin/sales/today</div>
            <div><span className="text-yellow-600">POST</span> /admin/menu/upload</div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default NoBackendMessage;