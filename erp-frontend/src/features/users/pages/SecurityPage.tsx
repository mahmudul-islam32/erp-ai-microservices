import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { settingsApi, SettingsCategory, SecuritySettings } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { Save, Loader2, Shield } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SecuritySettings>>({});

  useEffect(() => {
    loadSettings();
  }, []);

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
