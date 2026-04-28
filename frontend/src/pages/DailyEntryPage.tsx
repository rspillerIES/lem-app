import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Project } from '../types';

export const DailyEntryPage: React.FC = () => {
  const user = useAuth((state) => state.user);
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    project_id: projectId || '',
    date_of_work: new Date().toISOString().split('T')[0],
    regular_hours: '',
    cost_code_id: 'LABOR',
    position_name: 'Laborer',
    employee_id: user?.user_id || '',
  });

  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchEntries();
    }
  }, [formData.project_id]);

  const fetchProjects = async () => {
    try {
      const response = await api.getProjects();
      const projectsList = Array.isArray(response) ? response : (response.projects || []);
      setProjects(projectsList);
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await api.getEntries(formData.project_id);
      const data = response.entries || response;
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.saveTimeEntry(formData.project_id, {
        date_of_work: formData.date_of_work,
        regular_hours: parseFloat(formData.regular_hours) || 0,
        cost_code_id: formData.cost_code_id,
        position_name: formData.position_name,
        employee_id: formData.employee_id,
      });

      setSuccess('Entry created successfully!');

      setFormData({
        project_id: formData.project_id,
        date_of_work: new Date().toISOString().split('T')[0],
        regular_hours: '',
        cost_code_id: 'LABOR',
        position_name: 'Laborer',
        employee_id: user?.user_id || '',
      });

      await fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 block"
          >
            ← Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Daily Time Entry</h1>
          <p className="text-gray-600 mt-1">Log your work hours</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Work *
                  </label>
                  <input
                    type="date"
                    name="date_of_work"
                    value={formData.date_of_work}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regular Hours *
                  </label>
                  <input
                    type="number"
                    name="regular_hours"
                    value={formData.regular_hours}
                    onChange={handleInputChange}
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Code *
                  </label>
                  <input
                    type="text"
                    name="cost_code_id"
                    value={formData.cost_code_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="LABOR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="position_name"
                    value={formData.position_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Laborer"
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Log Time Entry'}
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card title="Recent Entries" subtitle={`${entries.length} total`}>
              {entries.length === 0 ? (
                <p className="text-gray-500 text-sm">No entries yet</p>
              ) : (
                <div className="space-y-3">
                  {entries.slice(0, 5).map((entry) => (
                    <div key={entry.time_entry_id} className="text-sm border-b pb-2">
                      <p className="font-medium text-gray-900">
                        {entry.regular_hours}h on {entry.date_of_work}
                      </p>
                      <p className="text-gray-600">{entry.position_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
