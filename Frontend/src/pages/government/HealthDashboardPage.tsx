import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Health Officer Dashboard
 * Sees: Health-related services (future — currently empty)
 * Route: /government/health-dashboard
 */
const HealthDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Health Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['HEALTH_OFFICER']}
  />
);

export default HealthDashboardPage;
