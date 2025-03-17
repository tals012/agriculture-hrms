"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "@/styles/pages/remote-document.module.scss";

// Will need to create this API endpoint
const fetchDocument = async (slug) => {
  try {
    const response = await fetch(`/api/remote-document/${slug}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch document");
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};

// Will need to create this API endpoint
const submitSignedDocument = async (slug, signatureData) => {
  try {
    const response = await fetch(`/api/remote-document/${slug}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signatureData }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to submit document");
    }
    
    return data;
  } catch (error) {
    console.error("Error submitting document:", error);
    throw error;
  }
};

export default function RemoteDocumentPage() {
  const { slug } = useParams();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDocument(slug);
        setDocument(data.document);
      } catch (error) {
        setError(error.message || "Failed to load document");
        toast.error(error.message || "Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (slug) {
      loadDocument();
    }
  }, [slug]);
  
  const handleSignatureChange = (e) => {
    setSignature(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!signature) {
      toast.error("Please enter your signature");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await submitSignedDocument(slug, signature);
      setSubmitted(true);
      toast.success("Document signed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to submit document");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <h2>Thank You!</h2>
          <p>Your document has been signed successfully.</p>
          <div className={styles.checkmark}>✓</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {document ? (
        <>
          <div className={styles.header}>
            <h1>{document.name}</h1>
          </div>
          
          <div className={styles.documentContainer}>
            {document.url && (
              <iframe 
                src={document.url}
                className={styles.documentViewer}
                title="Document Viewer"
              ></iframe>
            )}
          </div>
          
          <div className={styles.signatureContainer}>
            <h3>Sign Document</h3>
            <p>Please type your full name below to sign this document:</p>
            
            <form onSubmit={handleSubmit} className={styles.signatureForm}>
              <input
                type="text"
                placeholder="Type your full name here"
                value={signature}
                onChange={handleSignatureChange}
                className={styles.signatureInput}
                required
              />
              
              <button 
                type="submit" 
                className={styles.signButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing..." : "Sign Document"}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className={styles.errorContainer}>
          <h2>Document Not Found</h2>
          <p>The requested document could not be found or has expired.</p>
        </div>
      )}
    </div>
  );
} 