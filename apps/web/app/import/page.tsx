import React from 'react';
import { Metadata } from "next";
import ImportLayout from "./components/ImportLayout";
import ImportDashboard from "./components/ImportDashboard";

export const metadata: Metadata = {
  title: "Import Data | DFDA",
  description: "Import and visualize your health data",
};

export default function ImportPage() {
  return (
    <ImportLayout>
      <ImportDashboard />
    </ImportLayout>
  );
}
