import { getCompanyConfig, updateCompanyConfig, getPaymentGateways, updatePaymentGateway } from './server/db.ts';

async function main() {
  try {
    const config = await getCompanyConfig();
    console.log("Current config:", config);
    
    const updatedConfig = await updateCompanyConfig({ commissionRate: 5.5 });
    console.log("Updated config:", updatedConfig);
    
    const gateways = await getPaymentGateways();
    console.log("Current gateways:", gateways);
    
    await updatePaymentGateway("esewa", { apiKey: "test-key" });
    const gatewaysAfter = await getPaymentGateways();
    console.log("Gateways after:", gatewaysAfter);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
