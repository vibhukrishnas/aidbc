import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle,
  actions,
  variant = 'default',
  elevated = false,
  ...props 
}) => {
  const classes = [
    'card',
    card-${variant},
    elevated && 'card-elevated'
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;
