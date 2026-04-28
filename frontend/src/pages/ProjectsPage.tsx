import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.getProjects();
      setProjects(Array.isArray(response) ? response : response.projects || []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    navigate('/projects/new');
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.full_name}</p>
          </div>
          <Button variant="primary" onClick={handleNewProject}>
            + New Project
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <Card className="mb-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {isLoading ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">Loading projects...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 mb-4">No projects yet</p>
            <Button variant="primary" onClick={handleNewProject}>
              Create Your First Project
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.project_id}
                title={project.project_name}
                subtitle={`#${project.project_number}`}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProjectClick(project.project_id)}
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      PO Number
                    </p>
                    <p className="font-medium">{project.po_number}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      PO Value
                    </p>
                    <p className="font-medium">
                      ${project.po_value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Status
                    </p>
                    {project.client_approval_locked ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Locked
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectClick(project.project_id);
                    }}
                  >
                    View Project →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
