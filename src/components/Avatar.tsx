import { avatarColor, getInitials } from '@/lib/utils';
import type { Profile } from '@/types';

interface AvatarProps {
  profile: Profile | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

export function Avatar({ profile, size = 'md' }: AvatarProps) {
  if (!profile) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-secondary-200 dark:bg-secondary-700`} />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${avatarColor(profile.id)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      title={profile.display_name}
    >
      {getInitials(profile.display_name)}
    </div>
  );
}
