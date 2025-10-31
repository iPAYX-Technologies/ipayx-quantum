import { useState } from 'react';
import { apiOrchestrator } from '../services/api-orchestrator.service';
import type { ApiResponse } from '../services/api-orchestrator.service';

export function ApiDemo() {
  const [endpoint, setEndpoint] = useState('/api/status');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const makeRequest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      let result;
      if (method === 'GET') {
        result = await apiOrchestrator.get(endpoint);
      } else {
        const parsedBody = body ? JSON.parse(body) : undefined;
        result = await apiOrchestrator.post(endpoint, parsedBody);
      }
      setResponse(result);
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Request failed',
        status: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        API Orchestrator Demo
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            HTTP Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endpoint
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/endpoint"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {method === 'POST' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Body (JSON)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>
        )}

        <button
          onClick={makeRequest}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Send Request'}
        </button>

        {response && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response
            </label>
            <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto text-xs font-mono text-gray-900 dark:text-gray-100">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
