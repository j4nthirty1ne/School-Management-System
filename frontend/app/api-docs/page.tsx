"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Complete API reference for the School Management System
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <SwaggerUI url="/api/swagger" />
        </div>
      </div>
    </div>
  );
}
