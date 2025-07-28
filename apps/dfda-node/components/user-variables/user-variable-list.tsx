import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button"; // No longer needed directly
// import Link from 'next/link'; // No longer needed directly
import { InternalLinkButton } from '@/components/internal-link-button'; // Use the enhanced button
import type { UserVariableWithMeasurements } from '@/lib/actions/user-variables';
import { VARIABLE_CATEGORIES_DATA } from '@/lib/constants/variable-categories';

interface UserVariableListProps {
    userVariables: UserVariableWithMeasurements[];
}

export function UserVariableList({ userVariables }: UserVariableListProps) {
    if (userVariables.length === 0) {
        return <p>No user variables found.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userVariables.map((variable) => {
                // Extract needed properties safely
                const name = variable.global_variables?.name ?? 'Unknown Variable';
                // const description = variable.notes ?? 'No description provided.'; // Removed - 'notes' not selected/available on type
                const categoryId = variable.global_variables?.variable_category_id;
                const categoryName = categoryId ? (VARIABLE_CATEGORIES_DATA[categoryId]?.name ?? 'Unknown Category') : 'Unknown Category'; // Get category name
                const unitName = variable.units?.abbreviated_name ?? variable.global_variables?.units?.abbreviated_name ?? 'N/A'; // Get preferred or default unit
                const latestMeasurement = variable.measurements?.[0]; // Get the first measurement from the array

                return (
                    <Card key={variable.id}>
                        <CardHeader>
                            <CardTitle>{name}</CardTitle>
                            {/* <CardDescription>{description}</CardDescription> */}{/* Removed description */}
                        </CardHeader>
                        <CardContent>
                            <p>Category: {categoryName}</p>
                            <p>Unit: {unitName}</p>
                            <p>Latest Measurement: {latestMeasurement?.value !== undefined ? `${latestMeasurement.value} ${latestMeasurement.units?.abbreviated_name ?? ''}` : 'No measurements'}</p>
                            {/* Add more details as needed */}
                        </CardContent>
                        <CardFooter>
                            {/* <Link href={`/patient/user-variables/${variable.id}`} passHref>
                                <Button variant="outline" size="sm">View Details</Button>
                            </Link> */}
                            <InternalLinkButton
                                navKey="patient_user_variables_uservariableid" // The key for the dynamic route
                                params={{ userVariableId: variable.id }} // The dynamic segment value
                                variant="outline"
                                size="sm"
                            />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
} 