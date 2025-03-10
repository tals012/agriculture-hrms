"use client";

import Spinner from "@/components/spinner";
import Form from "@/containers/screens/worker/signedForm/Form";
import { Suspense } from "react";

export default function SignedForm({ params }) {
  const { id } = params;
  if (!id) {
    return null;
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: '1.5rem'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '2rem'
      }}>
        <Suspense fallback={<Spinner />}>
          <Form workerId={id} source="ADMIN" />
        </Suspense>
      </div>
    </div>
  );
} 