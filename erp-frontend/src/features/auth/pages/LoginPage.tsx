import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { login, clearError } from '../store/authSlice';
import { twoFactorService } from '../services/twoFactorService';
import { DesignButton } from '../../../shared/components/ui/DesignButton';
import { DesignInput } from '../../../shared/components/ui/DesignInput';
import { Card } from '../../../shared/components/ui/Card';
import { toast } from 'sonner';

import '@/styles/auth.css';

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
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    watch: watch2FA,
    setValue: setValue2FA,
    trigger: trigger2FA,
    formState: { errors: errors2FA },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    mode: 'onChange',
  });

  const usernameValue = watch('username') || '';
  const passwordValue = watch('password') || '';
  const codeValue = watch2FA('code') || '';

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
      <div className="auth-page">
        <Card className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <Shield size={32} />
            </div>
            <h1 className="auth-title">Two-Factor Authentication</h1>
            <p className="auth-subtitle">Enter your 6-digit code from your authenticator app</p>
          </div>

          <form onSubmit={handleSubmit2FA(onSubmit2FA)} className="auth-form">
            <DesignInput
              id="2fa-code"
              label="Verification Code"
              type="text"
              placeholder="000000"
              value={codeValue}
              onChange={(value) => {
                setValue2FA('code', value);
                trigger2FA('code');
              }}
              required
              disabled={verifying2FA}
              autoFocus
            />
            {errors2FA.code?.message && (
              <p className="auth-error">{errors2FA.code.message}</p>
            )}

            <DesignButton
              type="submit"
              variant="primary"
              size="large"
              fullwidth
              disabled={verifying2FA}
            >
              {verifying2FA ? 'Verifying...' : 'Verify'}
            </DesignButton>

            <DesignButton
              type="button"
              variant="secondary"
              size="medium"
              fullwidth
              onClick={() => {
                setRequires2FA(false);
                setUserEmail('');
                setUserPassword('');
              }}
            >
              Back to Login
            </DesignButton>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <LogIn size={32} />
          </div>
          <h1 className="auth-title">ERP System</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          <DesignInput
            id="username"
            label="Username"
            type="text"
            value={usernameValue}
            onChange={(value) => {
              setValue('username', value);
              trigger('username');
            }}
            required
            disabled={isLoading}
            autoFocus
          />
          {errors.username?.message && (
            <p className="auth-error">{errors.username.message}</p>
          )}

          <DesignInput
            id="password"
            label="Password"
            type="password"
            value={passwordValue}
            onChange={(value) => {
              setValue('password', value);
              trigger('password');
            }}
            required
            disabled={isLoading}
          />
          {errors.password?.message && (
            <p className="auth-error">{errors.password.message}</p>
          )}

          <DesignButton
            type="submit"
            variant="primary"
            size="large"
            fullwidth
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </DesignButton>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">Default credentials:</p>
          <p className="auth-footer-credentials">admin / admin123</p>
        </div>
      </Card>
    </div>
  );
};
