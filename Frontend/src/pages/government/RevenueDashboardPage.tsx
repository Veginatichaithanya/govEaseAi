import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Revenue Officer Dashboard
 * Sees: Revenue-related services (future — currently empty)
 * Route: /government/revenue-dashboard
 */
const RevenueDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Revenue Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['REVENUE_OFFICER']}
  />
);

export default RevenueDashboardPage;
