import React from 'react';
import GovernmentDashboard from '../../components/government/GovernmentDashboard';
import { ROLE_SERVICE_IDS } from '../../mock/governmentAuth';

/**
 * Licensing Officer Dashboard
 * Sees: Trade License + Shop Registration
 * Route: /government/licensing-dashboard
 */
const LicensingDashboardPage: React.FC = () => (
  <GovernmentDashboard
    title="Licensing Officer Dashboard"
    serviceIds={ROLE_SERVICE_IDS['LICENSING_OFFICER']}
  />
);

export default LicensingDashboardPage;
