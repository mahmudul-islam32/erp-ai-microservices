import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { login, clearError } from '../store/authSlice';
import { twoFactorService } from '../services/twoFactorService';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Card } from '../../../shared/components/ui/Card';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const twoFactorSchema = z.object({
  code: z.string().min(6, '6-digit code is required').max(6, '6-digit code is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, requires2FASetup } = useAppSelector((state) => state.auth);
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      // If 2FA setup is required, redirect to security page
      if (requires2FASetup) {
        navigate('/dashboard/security');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, requires2FASetup, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    setUserEmail(data.username);
    setUserPassword(data.password);
    
    try {
      const response = await dispatch(login(data)).unwrap();
      
      // Check if 2FA is required
      if (response && typeof response === 'object' && 'requires_2fa' in response && response.requires_2fa) {
        setRequires2FA(true);
        setUserEmail((response as any).email || data.username);
      }
    } catch (err: any) {
      // Error is handled by authSlice
    }
  };

  const onSubmit2FA = async (data: TwoFactorFormData) => {
    setVerifying2FA(true);
    try {
      const response = await twoFactorService.login(userEmail, userPassword, data.code);
      
      // Store tokens
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        
        // Dispatch login success
        dispatch({
          type: 'auth/login/fulfilled',
          payload: response,
        });
        
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Invalid 2FA code';
      toast.error(message);
    } finally {
      setVerifying2FA(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="text-slate-600 mt-2">Enter your 6-digit code from your authenticator app</p>
          </div>

          <form onSubmit={handleSubmit2FA(onSubmit2FA)} className="space-y-4">
            <Input
              label="Verification Code"
              type="text"
              placeholder="000000"
              maxLength={6}
              {...register2FA('code')}
              error={errors2FA.code?.message}
              disabled={verifying2FA}
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={verifying2FA}
            >
              Verify
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setRequires2FA(false);
                setUserEmail('');
                setUserPassword('');
              }}
            >
              Back to Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4">
            <LogIn className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ERP System</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <Input
            label="Username"
            type="text"
            {...register('username')}
            error={errors.username?.message}
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Default credentials:</p>
          <p className="font-mono mt-1">admin / admin123</p>
        </div>
      </Card>
    </div>
  );
};
