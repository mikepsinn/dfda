import { VitalClient, VitalEnvironment } from '@tryvital/vital-node';

if (!process.env.VITAL_API_KEY) {
  throw new Error('VITAL_API_KEY environment variable is not set');
}

const vital = new VitalClient({
  apiKey: process.env.VITAL_API_KEY,
  environment: process.env.NODE_ENV === 'production' 
    ? VitalEnvironment.Production 
    : VitalEnvironment.Sandbox,
});

export default vital;