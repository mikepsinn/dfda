import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type UserVariableWithDetails } from "@/lib/actions/user-variables"; // Import the type
import { AlertTriangle, List } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button

interface UserVariableListProps {
  variables: UserVariableWithDetails[];
  basePath?: string; // e.g., /patient/user-variables
}

export function UserVariableList({ variables, basePath = "/patient/user-variables" }: UserVariableListProps) {

  if (!variables || variables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tracked Variables</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Variables Tracked</AlertTitle>
              <AlertDescription>
                You haven't added any variables to track yet. 
                {/* TODO: Add link/button to add variables, maybe /patient/add-variable? */}
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><List className="mr-2 h-5 w-5"/> My Tracked Variables</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {variables.map((variable) => (
            <li key={variable.id} className="border rounded-md p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center">
                {variable.global_variables?.emoji && <span className="text-2xl mr-3">{variable.global_variables.emoji}</span>}
                <span className="font-medium">{variable.global_variables?.name ?? 'Unknown Variable'}</span>
              </div>
              <Link href={`${basePath}/${variable.id}`} passHref legacyBehavior={false}>
                    <Button variant="outline" size="sm">
                        View Details
                    </Button>
                </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 