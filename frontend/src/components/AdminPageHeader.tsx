import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div className="header-info">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && (
        <div className="header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
