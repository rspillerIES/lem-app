import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button } from '../components';
import { api } from '../services/api';
import { Project } from '../types';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'budget' | 'activity'>('overview');

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.getProjectById(projectId!);
      setProject(response.project);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="text-center py-12">
          <p className="text-gray-600">Loading project...</p>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="bg-red-50 border border-red-200">
          <p className="text-red-800 mb-4">{error || 'Project not found'}</p>
          <Button variant="primary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Projects
            </button>
            {!project.client_approval_locked && (
              <Button variant="secondary" size="sm">
                Lock Project
              </Button>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-600 mt-1">Project #{project.project_number}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {(['overview', 'entries', 'budget', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Project Details">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500 uppercase tracking-wide">PO Number</dt>
                  <dd className="font-medium text-lg">{project.po_number}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 uppercase tracking-wide">PO Value</dt>
                  <dd className="font-medium text-lg">
                    ${project.po_value.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 uppercase tracking-wide">Budget Type</dt>
                  <dd className="font-medium">{project.budget_type}</dd>
                </div>
                {project.pm_name && (
                  <div>
                    <dt className="text-sm text-gray-500 uppercase tracking-wide">PM</dt>
                    <dd className="font-medium">{project.pm_name}</dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card title="Quick Actions">
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/entries`)}
                >
                  + Add Daily Entry
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/activity`)}
                >
                  + Add Activity Note
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/budget`)}
                >
                  View Budget
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'entries' && (
          <Card title="Daily Entries">
            <p className="text-gray-600 py-8 text-center">Entries view coming soon</p>
          </Card>
        )}

        {activeTab === 'budget' && (
          <Card title="Budget Breakdown">
            <p className="text-gray-600 py-8 text-center">Budget view coming soon</p>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card title="Activity Log">
            <p className="text-gray-600 py-8 text-center">Activity log coming soon</p>
          </Card>
        )}
      </div>
    </div>
  );
};
