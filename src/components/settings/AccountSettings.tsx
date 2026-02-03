"use client"

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Smartphone, Monitor, LogOut, AlertCircle, CheckCircle2, QrCode, Loader2 } from "lucide-react";
import BankDetailsSettings from "@/components/BankDetailsSettings";

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress: string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  status: string;
  actionType: string;
}

export default function AccountSettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: ""
  });

  // Real data for active sessions
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Real data for activity log
  const [activityLog, setActivityLog] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Fetch sessions and activities on mount
  useEffect(() => {
    fetchSessions();
    fetchActivities();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch('/api/account/sessions');
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await fetch('/api/account/activity');
      if (response.ok) {
        const data = await response.json();
        setActivityLog(data.activities || []);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let label = "";
    let color = "";

    if (score === 0) {
      label = "";
      color = "";
    } else if (score <= 2) {
      label = "Weak";
      color = "bg-red-500";
    } else if (score <= 3) {
      label = "Fair";
      color = "bg-yellow-500";
    } else if (score <= 4) {
      label = "Good";
      color = "bg-blue-500";
    } else {
      label = "Strong";
      color = "bg-green-500";
    }

    setPasswordStrength({ score, label, color });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (name === "newPassword") {
      calculatePasswordStrength(value);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordStrength.score < 3) {
      alert("Please choose a stronger password");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("Password changed successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordStrength({ score: 0, label: "", color: "" });
        // Refresh activity log to show password change
        fetchActivities();
      } else {
        alert(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = () => {
    setShow2FASetup(true);
  };

  const handleConfirm2FA = () => {
    setTwoFactorEnabled(true);
    setShow2FASetup(false);
    alert("Two-factor authentication enabled successfully");
  };

  const handleDisable2FA = () => {
    if (confirm("Are you sure you want to disable two-factor authentication?")) {
      setTwoFactorEnabled(false);
      alert("Two-factor authentication disabled");
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to log out this session?")) {
      try {
        const response = await fetch('/api/account/sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
          alert("Session logged out successfully");
          // Refresh sessions list
          fetchSessions();
        } else {
          alert("Failed to logout session");
        }
      } catch (error) {
        console.error('Error logging out session:', error);
        alert("Error logging out session");
      }
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    if (confirm("Are you sure you want to log out all other sessions?")) {
      try {
        const response = await fetch('/api/account/sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoutAll: true })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(data.message || "All other sessions logged out successfully");
          // Refresh sessions list
          fetchSessions();
        } else {
          alert("Failed to logout sessions");
        }
      } catch (error) {
        console.error('Error logging out sessions:', error);
        alert("Error logging out sessions");
      }
    }
  };

  const getDeviceIcon = (device: string) => {
    const lowerDevice = device.toLowerCase();
    if (lowerDevice.includes('iphone') || lowerDevice.includes('android') || lowerDevice.includes('mobile')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Use 12+ characters with mix of letters, numbers & symbols
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword}
            className="bg-foreground hover:bg-gray-800"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Two-Factor Authentication</h2>
        
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
            {twoFactorEnabled ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              {twoFactorEnabled ? "2FA is Enabled" : "2FA is Disabled"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {twoFactorEnabled 
                ? "Your account is protected with two-factor authentication" 
                : "Add an extra layer of security to your account by enabling two-factor authentication"}
            </p>
            
            {!twoFactorEnabled ? (
              <Button onClick={handleEnable2FA} variant="outline">
                <Smartphone className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            ) : (
              <Button onClick={handleDisable2FA} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                Disable 2FA
              </Button>
            )}
          </div>
        </div>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-4">Set Up Two-Factor Authentication</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  1. Download an authenticator app like Google Authenticator or Authy
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  2. Scan this QR code with your authenticator app
                </p>
                
                <div className="flex justify-center my-4">
                  <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  3. Or manually enter this code:
                </p>
                <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm text-center">
                  XXXX XXXX XXXX XXXX
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent text-center font-mono text-lg"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleConfirm2FA} className="bg-foreground hover:bg-gray-800">
                  Verify & Enable
                </Button>
                <Button onClick={() => setShow2FASetup(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Active Sessions</h2>
        
        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        ) : activeSessions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No active sessions found</p>
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div 
                key={session.id}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getDeviceIcon(session.device)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{session.device}</h3>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-[#0CF574]/20 text-xs font-medium rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{session.location}</p>
                  <p className="text-xs text-gray-500 mt-1">Last active: {session.lastActive}</p>
                </div>

                {!session.current && (
                  <Button 
                    onClick={() => handleLogoutSession(session.id)}
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full text-red-600 border-red-600 hover:bg-red-50"
            onClick={handleLogoutAllOtherSessions}
            disabled={loadingSessions || activeSessions.filter(s => !s.current).length === 0}
          >
            Logout All Other Sessions
          </Button>
        </div>
      </Card>

      {/* Activity Log */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        
        {loadingActivities ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading activities...</span>
          </div>
        ) : activityLog.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activityLog.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
              >
                <div className={`p-1.5 rounded-full ${activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {activity.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{activity.action}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {activity.timestamp} • IP: {activity.ip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={fetchActivities}
            disabled={loadingActivities}
          >
            {loadingActivities ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Activity Log'
            )}
          </Button>
        </div>
      </Card>

      {/* Bank Details */}
      <div className="pt-6 border-t border-gray-200">
        <BankDetailsSettings />
      </div>
    </div>
  );
}
