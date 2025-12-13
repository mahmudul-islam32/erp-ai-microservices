import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { settingsApi, SettingsCategory, Settings, SettingsUpdate } from '../../settings/services/settingsApi';
import { toast } from 'sonner';
import { 
  Building2, 
  Mail, 
  Bell, 
  Plug, 
  Settings as SettingsIcon,
  Save,
  Loader2
} from 'lucide-react';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';

type TabType = SettingsCategory | 'all';

const tabConfig = [
  { id: SettingsCategory.COMPANY, label: 'Company', icon: Building2 },
  { id: SettingsCategory.EMAIL, label: 'Email', icon: Mail },
  { id: SettingsCategory.NOTIFICATIONS, label: 'Notifications', icon: Bell },
  { id: SettingsCategory.INTEGRATIONS, label: 'Integrations', icon: Plug },
  { id: SettingsCategory.GENERAL, label: 'General', icon: SettingsIcon },
];

export const SettingsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>(SettingsCategory.COMPANY);
  
  const canRead = hasPermission(Permission.SETTINGS_READ);
  const canUpdate = hasPermission(Permission.SETTINGS_UPDATE);
  const [settings, setSettings] = useState<Record<SettingsCategory, Settings | null>>({
    [SettingsCategory.COMPANY]: null,
    [SettingsCategory.FINANCIAL]: null,
    [SettingsCategory.SALES]: null,
    [SettingsCategory.INVENTORY]: null,
    [SettingsCategory.HR]: null,
    [SettingsCategory.EMAIL]: null,
    [SettingsCategory.NOTIFICATIONS]: null,
    [SettingsCategory.INTEGRATIONS]: null,
    [SettingsCategory.GENERAL]: null,
    [SettingsCategory.SECURITY]: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<Record<SettingsCategory, SettingsUpdate>>({
    [SettingsCategory.COMPANY]: {},
    [SettingsCategory.FINANCIAL]: {},
    [SettingsCategory.SALES]: {},
    [SettingsCategory.INVENTORY]: {},
    [SettingsCategory.HR]: {},
    [SettingsCategory.EMAIL]: {},
    [SettingsCategory.NOTIFICATIONS]: {},
    [SettingsCategory.INTEGRATIONS]: {},
    [SettingsCategory.GENERAL]: {},
    [SettingsCategory.SECURITY]: {},
  });

  useEffect(() => {
    // Permission check is handled by ProtectedRoute/PermissionRoute
    // Only load settings if user has permission (silent check)
    if (canRead) {
      loadSettings();
    }
  }, [canRead]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsApi.getAll();
      const settingsMap: Record<SettingsCategory, Settings | null> = {
        [SettingsCategory.COMPANY]: null,
        [SettingsCategory.FINANCIAL]: null,
        [SettingsCategory.SALES]: null,
        [SettingsCategory.INVENTORY]: null,
        [SettingsCategory.HR]: null,
        [SettingsCategory.EMAIL]: null,
        [SettingsCategory.NOTIFICATIONS]: null,
        [SettingsCategory.INTEGRATIONS]: null,
        [SettingsCategory.GENERAL]: null,
        [SettingsCategory.SECURITY]: null,
      };

      allSettings.forEach((setting) => {
        if (setting.category in settingsMap) {
          settingsMap[setting.category as SettingsCategory] = setting;
          // Initialize form data with existing settings
          const categoryData: SettingsUpdate = {};
          if (setting.company_info) categoryData.company_info = setting.company_info;
          if (setting.financial) categoryData.financial = setting.financial;
          if (setting.sales) categoryData.sales = setting.sales;
          if (setting.inventory) categoryData.inventory = setting.inventory;
          if (setting.email) categoryData.email = setting.email;
          if (setting.notifications) categoryData.notifications = setting.notifications;
          if (setting.integrations) categoryData.integrations = setting.integrations;
          if (setting.general) categoryData.general = setting.general;
          if (setting.security) {
            // CRITICAL: Use actual boolean values from response, not === true conversion
            // The backend returns a dict with actual boolean values (true/false)
            categoryData.security = {
              password_min_length: setting.security.password_min_length ?? 8,
              // Use ?? operator: if value is false, keep false. If undefined, default to false
              password_require_uppercase: setting.security.password_require_uppercase ?? false,
              password_require_lowercase: setting.security.password_require_lowercase ?? false,
              password_require_numbers: setting.security.password_require_numbers ?? false,
              password_require_special_chars: setting.security.password_require_special_chars ?? false,
              require_password_change_on_first_login: setting.security.require_password_change_on_first_login ?? false,
              max_login_attempts: setting.security.max_login_attempts ?? 5,
              account_lockout_duration_minutes: setting.security.account_lockout_duration_minutes ?? 30,
              session_timeout_minutes: setting.security.session_timeout_minutes ?? 30,
              enable_two_factor_auth: setting.security.enable_two_factor_auth ?? false,
              require_two_factor_auth: setting.security.require_two_factor_auth ?? false,
              token_refresh_enabled: setting.security.token_refresh_enabled ?? false,
              refresh_token_expire_days: setting.security.refresh_token_expire_days ?? 7,
            };
            console.log('Loaded security settings from DB:', categoryData.security);
            console.log('Boolean values:', {
              password_require_numbers: categoryData.security.password_require_numbers,
              password_require_special_chars: categoryData.security.password_require_special_chars,
            });
          }
          
          setFormData((prev) => ({
            ...prev,
            [setting.category]: categoryData,
          }));
          
          // Set logo preview if company logo exists
          if (setting.category === SettingsCategory.COMPANY && setting.company_info?.logo_url) {
            setLogoPreview(setting.company_info.logo_url);
          }
        }
      });

      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: SettingsCategory) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update settings');
      return;
    }
    
    setSaving(true);
    try {
      let data = formData[category];
      
      // For company settings, handle company_name when logo exists
      if (category === SettingsCategory.COMPANY && data.company_info) {
        const companyInfo = data.company_info;
        // If logo exists and company_name is empty, set it to undefined/null
        if (companyInfo.logo_url && (!companyInfo.company_name || companyInfo.company_name.trim() === '')) {
          data = {
            ...data,
            company_info: {
              ...companyInfo,
              company_name: undefined, // Remove empty company_name when logo exists
            },
          };
        }
      }
      
      // For security settings, ensure ALL fields are explicitly included with their current values
      if (category === SettingsCategory.SECURITY) {
        // Get the current formData value (most recent user input)
        const formSecurity = formData[SettingsCategory.SECURITY]?.security || {};
        // Get saved settings as fallback
        const savedSecurity = settings[SettingsCategory.SECURITY]?.security || {};
        
        console.log('🔍 BEFORE MERGE - formSecurity:', JSON.stringify(formSecurity, null, 2));
        console.log('🔍 BEFORE MERGE - savedSecurity:', JSON.stringify(savedSecurity, null, 2));
        
        // CRITICAL FIX: Start with savedSecurity, but ONLY use formSecurity values that were explicitly set
        // The key is: if a field exists in formSecurity (even if false), it means user changed it
        const currentSecurity: any = {};
        
        // First, copy all saved values
        Object.keys(savedSecurity).forEach(key => {
          currentSecurity[key] = savedSecurity[key];
        });
        
        // Then, override with formSecurity values - this ensures user's changes (including false) take precedence
        Object.keys(formSecurity).forEach(key => {
          // If key exists in formSecurity, use it (even if false) - this is the user's explicit choice
          currentSecurity[key] = formSecurity[key];
        });
        
        // Also handle password_require_special vs password_require_special_chars
        if ('password_require_special' in formSecurity) {
          currentSecurity.password_require_special_chars = formSecurity.password_require_special;
        } else if ('password_require_special_chars' in formSecurity) {
          currentSecurity.password_require_special_chars = formSecurity.password_require_special_chars;
        }
        
        console.log('🔍 AFTER MERGE - currentSecurity:', JSON.stringify(currentSecurity, null, 2));
        
        // Build securityData - use currentSecurity values, defaulting to false for booleans if not set
        const securityData: any = {
          password_min_length: currentSecurity.password_min_length ?? 8,
          // Use currentSecurity value if it exists, otherwise default to false
          password_require_uppercase: currentSecurity.password_require_uppercase !== undefined ? currentSecurity.password_require_uppercase : false,
          password_require_lowercase: currentSecurity.password_require_lowercase !== undefined ? currentSecurity.password_require_lowercase : false,
          password_require_numbers: currentSecurity.password_require_numbers !== undefined ? currentSecurity.password_require_numbers : false,
          password_require_special_chars: (currentSecurity.password_require_special_chars !== undefined || currentSecurity.password_require_special !== undefined)
            ? (currentSecurity.password_require_special_chars ?? currentSecurity.password_require_special)
            : false,
          max_login_attempts: currentSecurity.max_login_attempts ?? 5,
          account_lockout_duration_minutes: currentSecurity.account_lockout_duration_minutes ?? 30,
          session_timeout_minutes: currentSecurity.session_timeout_minutes ?? 30,
          enable_two_factor_auth: currentSecurity.enable_two_factor_auth !== undefined ? currentSecurity.enable_two_factor_auth : false,
          require_two_factor_auth: currentSecurity.require_two_factor_auth !== undefined ? currentSecurity.require_two_factor_auth : false,
          token_refresh_enabled: currentSecurity.token_refresh_enabled !== undefined ? currentSecurity.token_refresh_enabled : false,
          refresh_token_expire_days: currentSecurity.refresh_token_expire_days ?? 7,
        };
        
        console.log('✅ Sending security data to backend:', JSON.stringify(securityData, null, 2));
        console.log('✅ CRITICAL VALUES:', {
          password_require_numbers: securityData.password_require_numbers,
          password_require_special_chars: securityData.password_require_special_chars,
          'formSecurity has password_require_numbers': 'password_require_numbers' in formSecurity,
          'formSecurity.password_require_numbers value': formSecurity.password_require_numbers,
        });
        
        data = {
          ...data,
          security: securityData,
        };
      }
      
      console.log('Saving security settings:', JSON.stringify(data, null, 2));
      const updated = await settingsApi.update(category, data);
      console.log('Received updated settings:', JSON.stringify(updated, null, 2));
      console.log('Security values from response:', {
        password_require_uppercase: updated.security?.password_require_uppercase,
        password_require_lowercase: updated.security?.password_require_lowercase,
        password_require_numbers: updated.security?.password_require_numbers,
        password_require_special_chars: updated.security?.password_require_special_chars,
      });
      
      // Update both formData and settings state with the response
      // This ensures UI reflects saved values immediately without reload
      if (updated.security) {
        // CRITICAL: Use the actual values from the response as-is
        // The backend returns a dict with actual boolean values (true/false)
        const updatedSecurity = {
          ...updated.security,
        };
        
        // Ensure all boolean fields are explicitly set (not undefined)
        updatedSecurity.password_require_uppercase = updated.security.password_require_uppercase ?? false;
        updatedSecurity.password_require_lowercase = updated.security.password_require_lowercase ?? false;
        updatedSecurity.password_require_numbers = updated.security.password_require_numbers ?? false;
        updatedSecurity.password_require_special_chars = updated.security.password_require_special_chars ?? false;
        updatedSecurity.enable_two_factor_auth = updated.security.enable_two_factor_auth ?? false;
        updatedSecurity.require_two_factor_auth = updated.security.require_two_factor_auth ?? false;
        updatedSecurity.token_refresh_enabled = updated.security.token_refresh_enabled ?? false;
        
        console.log('Updating formData with saved security:', updatedSecurity);
        console.log('CRITICAL - Boolean values from backend:', {
          password_require_uppercase: updatedSecurity.password_require_uppercase,
          password_require_lowercase: updatedSecurity.password_require_lowercase,
          password_require_numbers: updatedSecurity.password_require_numbers,
          password_require_special_chars: updatedSecurity.password_require_special_chars,
        });
        
        setFormData((prev) => ({
          ...prev,
          [category]: {
            security: updatedSecurity,
          },
        }));
        
        // Also update settings state
        setSettings((prev) => ({
          ...prev,
          [category]: {
            ...updated,
            security: updatedSecurity,
          },
        }));
      } else {
        // Update settings state even if no security field
        setSettings((prev) => ({
          ...prev,
          [category]: updated,
        }));
      }
      
      // Don't reload settings - we already have the updated values
      // await loadSettings(); // Commented out to prevent overwriting with defaults
      
      toast.success(`${tabConfig.find(t => t.id === category)?.label || category} settings saved successfully`);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      // Handle Pydantic validation errors from FastAPI
      let errorMessage = 'Failed to save settings';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // FastAPI returns validation errors as an array in detail
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail
            .map((err: any) => {
              // Handle loc array (e.g., ['body', 'company_info', 'logo_url'])
              const field = err.loc && Array.isArray(err.loc) 
                ? err.loc.slice(1).join('.') // Remove 'body' from loc
                : err.loc || 'field';
              return `${field}: ${err.msg || 'Validation failed'}`;
            })
            .join('; ');
          errorMessage = `Validation error: ${validationErrors}`;
        } 
        // Single object error (sometimes FastAPI returns single object)
        else if (errorData.detail && typeof errorData.detail === 'object' && !Array.isArray(errorData.detail)) {
          if (errorData.detail.msg) {
            const field = errorData.detail.loc && Array.isArray(errorData.detail.loc)
              ? errorData.detail.loc.slice(1).join('.')
              : 'field';
            errorMessage = `${field}: ${errorData.detail.msg}`;
          } else {
            // Fallback: stringify the error object
            errorMessage = `Validation error: ${JSON.stringify(errorData.detail)}`;
          }
        }
        // Single string detail
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error('Full error response:', error.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (category: SettingsCategory, field: string, value: any) => {
    setFormData((prev) => {
      const categoryData = prev[category] || {};
      const newData = { ...categoryData };
      
      // Handle nested fields (e.g., security.password_require_uppercase)
      if (field.includes('.')) {
        const parts = field.split('.');
        if (parts.length === 2) {
          const [parent, child] = parts;
          const parentData = (newData[parent as keyof SettingsUpdate] as any) || {};
          newData[parent as keyof SettingsUpdate] = {
            ...parentData,
            [child]: value,
          } as any;
          
          // Debug log for security settings
          if (category === SettingsCategory.SECURITY && parent === 'security') {
            console.log(`Updating security.${child} to:`, value, 'Type:', typeof value);
            console.log(`FormData after update:`, {
              ...newData,
              [parent]: {
                ...parentData,
                [child]: value,
              },
            });
          }
        } else if (parts.length === 3) {
          // Handle deeper nesting like address.street
          const [parent, nested, child] = parts;
          const parentData = (newData[parent as keyof SettingsUpdate] as any) || {};
          const nestedData = parentData[nested] || {};
          newData[parent as keyof SettingsUpdate] = {
            ...parentData,
            [nested]: {
              ...nestedData,
              [child]: value,
            },
          } as any;
        }
      } else {
        (newData as any)[field] = value;
      }
      
      // Debug: log the updated formData for security category
      if (category === SettingsCategory.SECURITY) {
        console.log('Updated formData.security:', newData.security);
      }
      
      return {
        ...prev,
        [category]: newData,
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    setUploadingLogo(true);
    try {
      // Convert to base64 for now (can be changed to upload to server later)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        updateFormData(SettingsCategory.COMPANY, 'company_info.logo_url', base64String);
        setUploadingLogo(false);
        toast.success('Logo uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
      setUploadingLogo(false);
    }
  };
  
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateFormData(SettingsCategory.COMPANY, 'company_info.logo_url', '');
  };

  const renderCompanySettings = () => {
    const data = formData[SettingsCategory.COMPANY].company_info || settings[SettingsCategory.COMPANY]?.company_info;
    const currentLogo = logoPreview || data?.logo_url || null;
    const isCompanyNameRequired = !currentLogo; // Required only if no logo
    
    return (
      <div className="space-y-6">
        {/* Company Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Company Logo</label>
          <div className="flex items-center gap-4">
            {currentLogo ? (
              <div className="relative">
                <img 
                  src={currentLogo} 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove logo"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                No logo
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    {currentLogo ? 'Change Logo' : 'Upload Logo'}
                  </>
                )}
              </label>
              <p className="text-xs text-slate-500 mt-1">Recommended: 200x200px, max 2MB</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="company-name"
            label="Company Name"
            value={data?.company_name || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.company_name', e.target.value)}
            required={isCompanyNameRequired}
            helperText={isCompanyNameRequired ? 'Required if no logo is uploaded' : 'Optional when logo is uploaded'}
          />
          <Input
            label="Legal Name"
            value={data?.legal_name || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.legal_name', e.target.value)}
          />
          <Input
            label="Registration Number"
            value={data?.registration_number || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.registration_number', e.target.value)}
          />
          <Input
            label="Tax ID"
            value={data?.tax_id || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.tax_id', e.target.value)}
          />
          <Input
            label="Website"
            value={data?.website || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.website', e.target.value)}
            type="url"
          />
          <Input
            label="Phone"
            value={data?.phone || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.phone', e.target.value)}
          />
          <Input
            label="Email"
            value={data?.email || ''}
            onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.email', e.target.value)}
            type="email"
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-3">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Street"
              value={data?.address?.street || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                street: e.target.value,
              })}
            />
            <Input
              label="City"
              value={data?.address?.city || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                city: e.target.value,
              })}
            />
            <Input
              label="State"
              value={data?.address?.state || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                state: e.target.value,
              })}
            />
            <Input
              label="Zip Code"
              value={data?.address?.zip_code || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                zip_code: e.target.value,
              })}
            />
            <Input
              label="Country"
              value={data?.address?.country || ''}
              onChange={(e) => updateFormData(SettingsCategory.COMPANY, 'company_info.address', {
                ...data?.address,
                country: e.target.value,
              })}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    const data = formData[SettingsCategory.NOTIFICATIONS].notifications || settings[SettingsCategory.NOTIFICATIONS]?.notifications;
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Email Notifications</label>
              <p className="text-xs text-slate-500 mt-1">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={data?.email_notifications !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.email_notifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Push Notifications</label>
              <p className="text-xs text-slate-500 mt-1">Receive browser push notifications</p>
            </div>
            <input
              type="checkbox"
              checked={data?.push_notifications !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.push_notifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Order Created</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a new order is created</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_order_created !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_order_created', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Invoice Created</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a new invoice is created</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_invoice_created !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_invoice_created', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Payment Received</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when a payment is received</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_payment_received !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_payment_received', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-900">Notify on Low Stock</label>
              <p className="text-xs text-slate-500 mt-1">Get notified when inventory is low</p>
            </div>
            <input
              type="checkbox"
              checked={data?.notify_on_low_stock !== false}
              onChange={(e) => updateFormData(SettingsCategory.NOTIFICATIONS, 'notifications.notify_on_low_stock', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderIntegrationSettings = () => {
    const data = formData[SettingsCategory.INTEGRATIONS].integrations || settings[SettingsCategory.INTEGRATIONS]?.integrations;
    
    return (
      <div className="space-y-6">
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Stripe Payment Gateway</h4>
              <p className="text-xs text-slate-500 mt-1">Enable Stripe for payment processing</p>
            </div>
            <input
              type="checkbox"
              checked={data?.stripe_enabled || false}
              onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_enabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>
          {data?.stripe_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Stripe Secret Key"
                type="password"
                value={data?.stripe_secret_key || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_secret_key', e.target.value)}
                placeholder="sk_test_..."
              />
              <Input
                label="Stripe Publishable Key"
                value={data?.stripe_publishable_key || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_publishable_key', e.target.value)}
                placeholder="pk_test_..."
              />
              <Input
                label="Stripe Webhook Secret"
                type="password"
                value={data?.stripe_webhook_secret || ''}
                onChange={(e) => updateFormData(SettingsCategory.INTEGRATIONS, 'integrations.stripe_webhook_secret', e.target.value)}
                placeholder="whsec_..."
                className="md:col-span-2"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGeneralSettings = () => {
    const data = formData[SettingsCategory.GENERAL].general || settings[SettingsCategory.GENERAL]?.general;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Timezone"
            value={data?.timezone || 'UTC'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.timezone', e.target.value)}
          />
          <Select
            label="Date Format"
            value={data?.date_format || 'YYYY-MM-DD'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.date_format', e.target.value)}
            options={[
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
            ]}
          />
          <Select
            label="Time Format"
            value={data?.time_format || '24h'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.time_format', e.target.value)}
            options={[
              { value: '24h', label: '24 Hour' },
              { value: '12h', label: '12 Hour' },
            ]}
          />
          <Select
            label="Language"
            value={data?.language || 'en'}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.language', e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
            ]}
          />
          <Input
            label="Items Per Page"
            type="number"
            value={data?.items_per_page || 25}
            onChange={(e) => updateFormData(SettingsCategory.GENERAL, 'general.items_per_page', parseInt(e.target.value))}
            min={10}
            max={100}
          />
        </div>
      </div>
    );
  };

  const renderEmailSettings = () => {
    const emailSettings = settings[SettingsCategory.EMAIL];
    const emailData = formData[SettingsCategory.EMAIL].email || emailSettings?.email;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="SMTP Server"
              value={emailData?.smtp_server || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_server', e.target.value)}
              placeholder="smtp.gmail.com"
            />
            <Input
              label="SMTP Port"
              type="number"
              value={emailData?.smtp_port || 587}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_port', parseInt(e.target.value))}
              min={1}
              max={65535}
            />
            <Input
              label="SMTP Username"
              value={emailData?.smtp_username || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_username', e.target.value)}
            />
            <Input
              label="SMTP Password"
              type="password"
              value={emailData?.smtp_password || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_password', e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smtp_use_tls"
                checked={emailData?.smtp_use_tls !== false}
                onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.smtp_use_tls', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="smtp_use_tls" className="text-sm font-medium text-slate-700">
                Use TLS
              </label>
            </div>
            <Input
              label="From Email"
              type="email"
              value={emailData?.from_email || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.from_email', e.target.value)}
            />
            <Input
              label="From Name"
              value={emailData?.from_name || ''}
              onChange={(e) => updateFormData(SettingsCategory.EMAIL, 'email.from_name', e.target.value)}
            />
        </div>
      </div>
    );
  };


  const renderTabContent = () => {
    if (loading) {
      return (
        <Card padding="lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </Card>
      );
    }

    switch (activeTab) {
      case SettingsCategory.COMPANY:
        return (
          <Card padding="lg">
            <CardHeader title="Company Information" subtitle="Manage your company details and address" />
            <CardContent>{renderCompanySettings()}</CardContent>
            {canUpdate && (
              <CardFooter>
                <Button onClick={() => handleSave(SettingsCategory.COMPANY)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      case SettingsCategory.EMAIL:
        return (
          <Card padding="lg">
            <CardHeader title="Email Settings" subtitle="Configure SMTP settings for email notifications" />
            <CardContent>{renderEmailSettings()}</CardContent>
            {canUpdate && (
              <CardFooter>
                <Button onClick={() => handleSave(SettingsCategory.EMAIL)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      case SettingsCategory.NOTIFICATIONS:
        return (
          <Card padding="lg">
            <CardHeader title="Notification Preferences" subtitle="Configure how you receive notifications" />
            <CardContent>{renderNotificationSettings()}</CardContent>
            {canUpdate && (
              <CardFooter>
                <Button onClick={() => handleSave(SettingsCategory.NOTIFICATIONS)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      case SettingsCategory.INTEGRATIONS:
        return (
          <Card padding="lg">
            <CardHeader title="Integration Settings" subtitle="Configure third-party integrations" />
            <CardContent>{renderIntegrationSettings()}</CardContent>
            {canUpdate && (
              <CardFooter>
                <Button onClick={() => handleSave(SettingsCategory.INTEGRATIONS)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      case SettingsCategory.GENERAL:
        return (
          <Card padding="lg">
            <CardHeader title="General Settings" subtitle="Configure general application preferences" />
            <CardContent>{renderGeneralSettings()}</CardContent>
            {canUpdate && (
              <CardFooter>
                <Button onClick={() => handleSave(SettingsCategory.GENERAL)} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Configure system-wide settings and preferences" />

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};
