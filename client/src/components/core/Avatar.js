import React from 'react';
import './Avatar.css';

const Avatar = ({ user, size = 'medium', online = false }) => {
  const sizeClasses = {
    small: 'avatar-sm',
    medium: 'avatar-md',
    large: 'avatar-lg'
  };

  return (
    <div className={vatar ${sizeClasses[size]} ${online ? 'avatar-online' : ''}}>
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        <div className="avatar-initials">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      {online && <div className="avatar-status"></div>}
    </div>
  );
};

export default Avatar;
