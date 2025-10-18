import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '@/components/common';
import { useAuth, useLogin } from '@/hooks/auth';
import Bg from '@/assets/images/bg.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${Bg})` }}>
      <Card className="w-full max-w-md p-8 space-y-8 bg-white/30 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-center text-text-dark">MDDC Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-red-500 text-sm">
              {'data' in error ? JSON.stringify(error.data) : 'Login failed'}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
