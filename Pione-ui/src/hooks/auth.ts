import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useLoginMutation, useGetCurrentUserQuery } from '@/features/api/apiSlice';
import { setCredentials, logout } from '@/features/auth/authSlice';

export const useAuth = () => {
  const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    token,
    user,
    isAuthenticated,
    logout: handleLogout,
  };
};

export const useAuthGuard = (redirectTo: string = '/login') => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return isAuthenticated;
};

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const [loginMutation, loginState] = useLoginMutation();
  const { data: user } = useGetCurrentUserQuery(undefined, {
    skip: !loginState.isSuccess,
  });

  const login = async (username: string, password: string) => {
    try {
      const result = await loginMutation({ username, password }).unwrap();
      dispatch(setCredentials({ token: result.access_token }));
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  return {
    login,
    user,
    isLoading: loginState.isLoading,
    error: loginState.error,
  };
};