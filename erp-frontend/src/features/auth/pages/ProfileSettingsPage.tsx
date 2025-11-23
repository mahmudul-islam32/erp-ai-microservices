import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardFooter } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { authService } from '../services/authService';
import { settingsApi, SettingsCategory, SecuritySettings } from '../../settings/services/settingsApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { getCurrentUser } from '../store/authSlice';
import { toast } from 'sonner';
import { User, Camera, Save, Lock } from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    profile_image: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        profile_image: user.profile_image || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const settings = await settingsApi.getByCategory(SettingsCategory.SECURITY);
        if (settings.security) {
          setSecuritySettings(settings.security);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
        // Use defaults if settings can't be loaded
      }
    };
    loadSecuritySettings();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({ ...prev, profile_image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authService.updateProfile(formData);
      await dispatch(getCurrentUser());
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (!securitySettings) {
      // Default validation
      if (password.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      return null;
    }

    const minLength = securitySettings.password_min_length || 8;
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }

    if (securitySettings.password_require_uppercase && !/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (securitySettings.password_require_lowercase && !/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (securitySettings.password_require_numbers && !/\d/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (securitySettings.password_require_special_chars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return 'Password must contain at least one special character';
    }

    return null;
  };

  const getPasswordHelperText = (): string => {
    if (!securitySettings) {
      return 'Password must be at least 8 characters long';
    }

    const requirements: string[] = [];
    requirements.push(`at least ${securitySettings.password_min_length} characters`);
    
    if (securitySettings.password_require_uppercase) {
      requirements.push('one uppercase letter');
    }
    if (securitySettings.password_require_lowercase) {
      requirements.push('one lowercase letter');
    }
    if (securitySettings.password_require_numbers) {
      requirements.push('one number');
    }
    if (securitySettings.password_require_special_chars) {
      requirements.push('one special character');
    }

    return `Password must contain ${requirements.join(', ')}`;
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    const validationError = validatePassword(passwordData.new_password);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (user) {
      const first = user.first_name?.charAt(0) || '';
      const last = user.last_name?.charAt(0) || '';
      return (first + last).toUpperCase() || 'U';
    }
    return 'U';
  };

  return (
    <div>
      <PageHeader 
        title="Profile Settings" 
        subtitle="Manage your profile information and password" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Image */}
          <Card>
            <CardHeader title="Profile Picture" />
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-200 dark:border-slate-700">
                      {getInitials()}
                    </div>
                  )}
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Upload a profile picture. Maximum file size: 5MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (formData.profile_image) {
                        setFormData((prev) => ({ ...prev, profile_image: '' }));
                      }
                    }}
                  >
                    Remove Picture
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader title="Personal Information" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  disabled
                  helperText="Email cannot be changed"
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <Input
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter align="right">
              <Button
                onClick={handleSaveProfile}
                isLoading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader title="Change Password" />
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                  helperText={getPasswordHelperText()}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter align="right">
              <Button
                onClick={handleChangePassword}
                isLoading={changingPassword}
                variant="primary"
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account Information" />
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {user?.role || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 capitalize">
                    {user?.status || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                {user?.last_login && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Last Login</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {new Date(user.last_login).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

