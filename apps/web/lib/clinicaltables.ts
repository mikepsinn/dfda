
export async function searchClinicalTrialConditions(condition: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(condition)}&dictionary=Condition`);
        if (!response.ok) {
            throw new Error('Failed to fetch condition suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching condition suggestions:', error);
        return [];
    }
}

export async function searchClinicalTrialInterventions(intervention: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(intervention)}&dictionary=InterventionName`);
        if (!response.ok) {
            throw new Error('Failed to fetch intervention suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching intervention suggestions:', error);
        return [];
    }
}

export async function searchClinicalTrialSponsors(sponsor: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(sponsor)}&dictionary=LeadSponsorName`);
        if (!response.ok) {
            throw new Error('Failed to fetch sponsor suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching sponsor suggestions:', error);
        return [];
    }
}

export async function searchClinicalTrialLocations(facility: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(facility)}&dictionary=LocationFacility`);
        if (!response.ok) {
            throw new Error('Failed to fetch location suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching location suggestions:', error);
        return [];
    }
}
export async function searchFdaTreatments(treatment: string): Promise<string[]> {
    try {
        const encodedTreatment = encodeURIComponent(treatment);
        const response = await fetch(`https://api.fda.gov/drug/label.json?search=indications_and_usage:"${encodedTreatment}"&limit=10`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) {
            return [];
        }
        
        return data.results
            .filter((item: any) => item.openfda?.brand_name)
            .map((item: any) => item.openfda.brand_name[0]);
    } catch (error) {
        console.error("Error in searchFdaTreatments:", error);
        return [];
    }
}


