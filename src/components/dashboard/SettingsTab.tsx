import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { User, Camera, Lock, Check, KeyRound } from 'lucide-react';
import { simpleHash } from '@/lib/utils';
import { notifyEmail } from '@/lib/email';

type Props = {
  onRefresh: () => void;
};

export default function SettingsTab({ onRefresh }: Props) {
  const { customer, updateProfilePicture } = useAuth();
  const [profileUrl, setProfileUrl] = useState(customer?.profile_picture || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Password change
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    if (!customer) return;
    setProfileMsg(null);
    if (!profileUrl.trim()) { setProfileMsg({ type: 'err', text: 'Enter an image URL.' }); return; }
    await updateProfilePicture(profileUrl.trim());
    setProfileMsg({ type: 'ok', text: 'Profile picture updated.' });
    onRefresh();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfileUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!customer) return;
    if (!curPw || !newPw || !confirmPw) { setPwMsg({ type: 'err', text: 'Fill in all fields.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setPwMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return; }
    if (customer.password_hash !== simpleHash(curPw)) { setPwMsg({ type: 'err', text: 'Current password is incorrect.' }); return; }

    setPwLoading(true);
    await supabase.from('customers').update({ password_hash: simpleHash(newPw) }).eq('id', customer.id);
    await notifyEmail(
      customer.email,
      'Password Changed - Alliance Global Bank',
      'Your Alliance Global Bank account password has been changed successfully. If you did not make this change, please contact our support team immediately at contact@allianceglobalbank.com or call +1 (934) 203-2652.'
    );
    setPwMsg({ type: 'ok', text: 'Password changed successfully. A confirmation email has been sent.' });
    setCurPw(''); setNewPw(''); setConfirmPw('');
    setPwLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile and security.</p>
      </div>

      {/* Profile picture */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold-400/15 flex items-center justify-center">
            <User className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="font-display font-bold text-white">Profile picture</div>
            <div className="text-sm text-gray-500">Upload or set a URL for your avatar.</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-display font-bold text-ink-950 text-2xl">
            {profileUrl ? <img src={profileUrl} alt="" className="w-full h-full object-cover" /> : customer?.full_name?.[0]}
          </div>
          <div className="flex-1 space-y-3">
            <input type="text" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="Image URL…" className="input-field" />
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="btn-ghost text-sm py-2">
                <Camera className="w-4 h-4" /> Upload file
              </button>
              <button onClick={handleSaveProfile} className="btn-primary text-sm py-2">Save</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        </div>
        {profileMsg && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${profileMsg.type === 'ok' ? 'bg-emerald2-500/10 border border-emerald2-500/20 text-emerald2-400' : 'bg-rose2-500/10 border border-rose2-500/20 text-rose2-400'}`}>
            {profileMsg.text}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold-400/15 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="font-display font-bold text-white">Change password</div>
            <div className="text-sm text-gray-500">Update your login password.</div>
          </div>
        </div>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label mb-1.5 block">Current password</label>
            <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="input-field" placeholder="Enter current password" />
          </div>
          <div>
            <label className="label mb-1.5 block">New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input-field" placeholder="Enter new password" />
          </div>
          <div>
            <label className="label mb-1.5 block">Confirm new password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="input-field" placeholder="Re-enter new password" />
          </div>
          {pwMsg && (
            <div className={`p-3 rounded-xl text-sm ${pwMsg.type === 'ok' ? 'bg-emerald2-500/10 border border-emerald2-500/20 text-emerald2-400' : 'bg-rose2-500/10 border border-rose2-500/20 text-rose2-400'}`}>
              {pwMsg.text}
            </div>
          )}
          <button onClick={handleChangePassword} disabled={pwLoading} className="btn-primary disabled:opacity-50">
            <Lock className="w-4 h-4" /> {pwLoading ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </div>
    </div>
  );
}
