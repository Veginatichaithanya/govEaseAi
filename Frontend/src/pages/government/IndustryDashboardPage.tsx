import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Industry Officer Dashboard
 * Sees: Factory Registration + Business License
 * Route: /government/industry-dashboard
 */
const IndustryDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Industry Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['INDUSTRY_OFFICER']}
  />
);

export default IndustryDashboardPage;
