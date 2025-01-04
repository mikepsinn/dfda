import { VitalClient, VitalEnvironment } from '@tryvital/vital-node';

const vital = new VitalClient({
  apiKey: process.env.VITAL_API_KEY,
  environment: process.env.NODE_ENV === 'production' 
    ? VitalEnvironment.Production 
    : VitalEnvironment.Sandbox,
});

export default vital;