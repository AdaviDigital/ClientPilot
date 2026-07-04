// components/StatCard.jsx
// Small reusable card used on the Dashboard and Analytics pages to display a single metric.

import React from 'react';

const StatCard = ({ label, value, icon: Icon, accent = 'brand' }) => {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
