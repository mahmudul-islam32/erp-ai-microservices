import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { settingsApi, SettingsCategory, SecuritySettings } from '../../settings/services/settingsApi';
import { twoFactorService } from '../../auth/services/twoFactorService';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clear2FASetupFlag, getCurrentUser } from '../../auth/store/authSlice';
import { toast } from 'sonner';
import { Save, Loader2, Shield, QrCode, CheckCircle, XCircle, Copy, RefreshCw, AlertCircle } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { requires2FASetup } = useAppSelector((state) => state.auth);
  
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SecuritySettings>>({});
  
  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<{ enabled: boolean; has_backup_codes: boolean } | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; qr_code_url: string; backup_codes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  useEffect(() => {
    console.log('SecurityPage mounted, loading settings and 2FA status');
    loadSettings();
    load2FAStatus();
    
    // Set a timeout to default to "not enabled" if status check takes too long
    const timeout = setTimeout(() => {
      setTwoFactorStatus((prev) => {
        if (prev === null) {
          console.warn('2FA status check timed out, defaulting to not enabled');
          return { enabled: false, has_backup_codes: false };
        }
        return prev;
      });
    }, 3000); // 3 second timeout (reduced from 5)
    
    return () => clearTimeout(timeout);
  }, []);

  const load2FAStatus = async () => {
    console.log('Loading 2FA status...');
    try {
      const status = await twoFactorService.getStatus();
      console.log('2FA status loaded:', status);
      setTwoFactorStatus(status);
    } catch (error: any) {
      console.error('Error loading 2FA status:', error);
      console.error('Error details:', error.response?.data || error.message);
      // If 2FA status endpoint fails, assume 2FA is not enabled
      // This allows users to set up 2FA even if status check fails
      setTwoFactorStatus({ enabled: false, has_backup_codes: false });
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const securitySetting = allSettings.find(s => s.category === SettingsCategory.SECURITY);
      
      if (securitySetting?.security) {
        const security = securitySetting.security;
        setSettings(security);
        setFormData({
          password_min_length: security.password_min_length ?? 8,
          password_require_uppercase: security.password_require_uppercase ?? false,
          password_require_lowercase: security.password_require_lowercase ?? false,
          password_require_numbers: security.password_require_numbers ?? false,
          password_require_special_chars: security.password_require_special_chars ?? false,
          require_password_change_on_first_login: security.require_password_change_on_first_login ?? false,
          max_login_attempts: security.max_login_attempts ?? 5,
          account_lockout_duration_minutes: security.account_lockout_duration_minutes ?? 30,
          session_timeout_minutes: security.session_timeout_minutes ?? 30,
          enable_two_factor_auth: security.enable_two_factor_auth ?? false,
          require_two_factor_auth: security.require_two_factor_auth ?? false,
          token_refresh_enabled: security.token_refresh_enabled ?? false,
          refresh_token_expire_days: security.refresh_token_expire_days ?? 7,
        });
      } else {
        // Set defaults if no settings exist
        const defaults: SecuritySettings = {
          password_min_length: 8,
          password_require_uppercase: true,
          password_require_lowercase: true,
          password_require_numbers: true,
          password_require_special_chars: false,
          require_password_change_on_first_login: false,
          max_login_attempts: 5,
          account_lockout_duration_minutes: 30,
          session_timeout_minutes: 30,
          enable_two_factor_auth: false,
          require_two_factor_auth: false,
          token_refresh_enabled: true,
          refresh_token_expire_days: 7,
        };
        setFormData(defaults);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build security data with explicit boolean values
      const securityData: SecuritySettings = {
        password_min_length: formData.password_min_length ?? 8,
        password_require_uppercase: formData.password_require_uppercase ?? false,
        password_require_lowercase: formData.password_require_lowercase ?? false,
        password_require_numbers: formData.password_require_numbers ?? false,
        password_require_special_chars: formData.password_require_special_chars ?? false,
        require_password_change_on_first_login: formData.require_password_change_on_first_login ?? false,
        max_login_attempts: formData.max_login_attempts ?? 5,
        account_lockout_duration_minutes: formData.account_lockout_duration_minutes ?? 30,
        session_timeout_minutes: formData.session_timeout_minutes ?? 30,
        enable_two_factor_auth: formData.enable_two_factor_auth ?? false,
        require_two_factor_auth: formData.require_two_factor_auth ?? false,
        token_refresh_enabled: formData.token_refresh_enabled ?? false,
        refresh_token_expire_days: formData.refresh_token_expire_days ?? 7,
      };

      const updated = await settingsApi.update(SettingsCategory.SECURITY, {
        security: securityData,
      });
      
      if (updated.security) {
        setSettings(updated.security);
        toast.success('Security settings saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof SecuritySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getBooleanValue = (field: keyof SecuritySettings): boolean => {
    return formData[field] === true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Security Settings" subtitle="Configure authentication and security preferences" />
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security Settings" 
        subtitle="Configure system-wide security policies and authentication settings"
        icon={Shield}
      />

      <Card padding="lg">
        <CardHeader 
          title="Password Requirements" 
          subtitle="Configure password requirements for user accounts"
        />
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Minimum Password Length"
                type="number"
                value={formData.password_min_length || 8}
                onChange={(e) => updateFormData('password_min_length', parseInt(e.target.value))}
                min={6}
                max={128}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Require Uppercase Letters
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Passwords must contain at least one uppercase letter
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={getBooleanValue('password_require_uppercase')}
                  onChange={(e) => updateFormData('password_require_uppercase', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Require Lowercase Letters
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Passwords must contain at least one lowercase letter
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={getBooleanValue('password_require_lowercase')}
                  onChange={(e) => updateFormData('password_require_lowercase', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Require Numbers
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Passwords must contain at least one number
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={getBooleanValue('password_require_numbers')}
                  onChange={(e) => updateFormData('password_require_numbers', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Require Special Characters (!@#$%^&*)
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Passwords must contain at least one special character
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={getBooleanValue('password_require_special_chars')}
                  onChange={(e) => updateFormData('password_require_special_chars', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card padding="lg">
        <CardHeader 
          title="Account Security" 
          subtitle="Configure login attempt policies and account lockout settings"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Max Login Attempts"
              type="number"
              value={formData.max_login_attempts || 5}
              onChange={(e) => updateFormData('max_login_attempts', parseInt(e.target.value))}
              min={3}
              max={10}
            />
            <Input
              label="Account Lockout Duration (Minutes)"
              type="number"
              value={formData.account_lockout_duration_minutes || 30}
              onChange={(e) => updateFormData('account_lockout_duration_minutes', parseInt(e.target.value))}
              min={5}
              max={1440}
            />
            <Input
              label="Session Timeout (Minutes)"
              type="number"
              value={formData.session_timeout_minutes || 30}
              onChange={(e) => updateFormData('session_timeout_minutes', parseInt(e.target.value))}
              min={5}
              max={1440}
              helperText="Users will be logged out after this period of inactivity"
            />
          </div>
        </CardContent>
      </Card>

      <Card padding="lg">
        <CardHeader 
          title="Two-Factor Authentication" 
          subtitle="Configure 2FA settings for enhanced security"
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Enable Two-Factor Authentication
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Allow users to enable 2FA for their accounts
                </p>
              </div>
              <input
                type="checkbox"
                checked={getBooleanValue('enable_two_factor_auth')}
                onChange={(e) => updateFormData('enable_two_factor_auth', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Require Two-Factor Authentication
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Force all users to use 2FA
                </p>
              </div>
              <input
                type="checkbox"
                checked={getBooleanValue('require_two_factor_auth')}
                onChange={(e) => updateFormData('require_two_factor_auth', e.target.checked)}
                disabled={!getBooleanValue('enable_two_factor_auth')}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {requires2FASetup && (
        <Card padding="lg" className="border-warning-300 bg-warning-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-warning-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-warning-900 mb-1">
                  Two-Factor Authentication Required
                </h3>
                <p className="text-sm text-warning-700 mb-4">
                  Your organization requires two-factor authentication for enhanced security. 
                  Please set up 2FA below to continue using the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card padding="lg">
        <CardHeader 
          title="Personal Two-Factor Authentication" 
          subtitle="Set up 2FA for your account using an authenticator app"
        />
        <CardContent>
          {twoFactorStatus === null ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-2 text-sm text-slate-500">Loading 2FA status...</span>
            </div>
          ) : twoFactorStatus.enabled ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success-600" />
                <div>
                  <p className="font-medium text-success-900">Two-Factor Authentication is Enabled</p>
                  <p className="text-sm text-success-700 mt-1">
                    Your account is protected with 2FA. You'll need to enter a code from your authenticator app when logging in.
                  </p>
                </div>
              </div>

              {showBackupCodes && twoFactorSetup?.backup_codes && (
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="font-medium text-warning-900 mb-2">Backup Codes</p>
                  <p className="text-sm text-warning-700 mb-3">
                    Save these codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {twoFactorSetup.backup_codes.map((code, index) => (
                      <div
                        key={index}
                        className="p-2 bg-white border border-warning-300 rounded font-mono text-sm text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetup.backup_codes.join('\n'));
                      toast.success('Backup codes copied to clipboard');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Codes
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const codes = await twoFactorService.regenerateBackupCodes();
                      setTwoFactorSetup({ ...twoFactorSetup!, backup_codes: codes.backup_codes });
                      setShowBackupCodes(true);
                      toast.success('New backup codes generated');
                    } catch (error: any) {
                      toast.error(error.response?.data?.detail || 'Failed to regenerate backup codes');
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    const password = prompt('Enter your password to disable 2FA:');
                    if (!password) return;
                    
                    try {
                      await twoFactorService.disable(password);
                      setTwoFactorStatus({ enabled: false, has_backup_codes: false });
                      setTwoFactorSetup(null);
                      setShowBackupCodes(false);
                      toast.success('2FA has been disabled');
                      // Reload status to ensure it's up to date
                      await load2FAStatus();
                    } catch (error: any) {
                      toast.error(error.response?.data?.detail || 'Failed to disable 2FA');
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : twoFactorSetup ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center mb-4">
                  <img
                    src={twoFactorSetup.qr_code_url}
                    alt="2FA QR Code"
                    className="border-2 border-slate-200 rounded-lg p-2 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500 mb-2">Or enter this secret manually:</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <code className="px-3 py-2 bg-slate-100 rounded text-sm font-mono">
                    {twoFactorSetup.secret}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetup.secret);
                      toast.success('Secret copied to clipboard');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Input
                  label="Enter 6-digit code from your authenticator app"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (verificationCode.length !== 6) {
                      toast.error('Please enter a 6-digit code');
                      return;
                    }
                    
                    setLoading2FA(true);
                    try {
                      const result = await twoFactorService.verify(verificationCode);
                      if (result.verified) {
                        setTwoFactorStatus({ enabled: true, has_backup_codes: true });
                        setTwoFactorSetup({ ...twoFactorSetup, backup_codes: result.backup_codes || [] });
                        setShowBackupCodes(true);
                        toast.success('2FA has been enabled successfully!');
                        // Clear the 2FA setup flag if it was set
                        if (requires2FASetup) {
                          dispatch(clear2FASetupFlag());
                        }
                        // Reload status to ensure it's up to date
                        await load2FAStatus();
                        // Reload user to get updated two_factor_enabled status
                        await dispatch(getCurrentUser());
                        // Clear the 2FA setup flag after user is reloaded
                        if (requires2FASetup) {
                          dispatch(clear2FASetupFlag());
                        }
                      }
                    } catch (error: any) {
                      toast.error(error.response?.data?.detail || 'Invalid verification code');
                    } finally {
                      setLoading2FA(false);
                    }
                  }}
                  disabled={verificationCode.length !== 6 || loading2FA}
                  isLoading={loading2FA}
                >
                  Verify & Enable
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTwoFactorSetup(null);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                Two-factor authentication adds an extra layer of security to your account.
              </p>
              <Button
                variant="primary"
                onClick={async () => {
                  setLoading2FA(true);
                  try {
                    const setup = await twoFactorService.setup();
                    setTwoFactorSetup(setup);
                  } catch (error: any) {
                    toast.error(error.response?.data?.detail || 'Failed to setup 2FA');
                  } finally {
                    setLoading2FA(false);
                  }
                }}
                disabled={loading2FA}
                isLoading={loading2FA}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Set Up 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card padding="lg">
        <CardHeader 
          title="Token Settings" 
          subtitle="Configure token refresh and expiration settings"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Enable Token Refresh
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Allow users to refresh their access tokens
                </p>
              </div>
              <input
                type="checkbox"
                checked={getBooleanValue('token_refresh_enabled')}
                onChange={(e) => updateFormData('token_refresh_enabled', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
            <Input
              label="Refresh Token Expiration (Days)"
              type="number"
              value={formData.refresh_token_expire_days || 7}
              onChange={(e) => updateFormData('refresh_token_expire_days', parseInt(e.target.value))}
              min={1}
              max={90}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
