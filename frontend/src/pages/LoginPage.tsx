import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FormInput, Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuth((state) => state.setAuth);
  const setLoading = useAuth((state) => state.setLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await api.login(email, password);
      setAuth(response.token, response.user);
      navigate('/projects');
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LEM App</h1>
          <p className="text-gray-600 mt-2">Daily Labor, Equipment & Material Tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
          />

          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>Demo Credentials:</strong>
          </p>
          <p className="text-xs text-gray-500 mt-2">Email: pm@impact.com</p>
          <p className="text-xs text-gray-500">Password: demo123</p>
        </div>
      </Card>
    </div>
  );
};
