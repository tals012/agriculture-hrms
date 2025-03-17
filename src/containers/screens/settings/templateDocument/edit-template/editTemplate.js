"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import PDFEditorForExising from "@/components/pdf/pdfEditorForExisitng";

const EditTemplate = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const link = searchParams.get("link");
  const name = searchParams.get("name");
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const blobRef = useRef(null);

  const loadRemoteFile = useCallback(async (_link) => {
    if (!_link) return;
    
    try {
      setError(null);
      setIsLoading(true);
      console.log("Fetching template from:", _link);
      
      const res = await fetch(_link);

      if (res.ok) {
        const blob = await res.blob();
        console.log("Template blob fetched successfully");
        
        // Convert blob to text
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          try {
            // Store the raw text
            setFile(event.target.result);
            console.log("Template loaded as text");
          } catch (parseError) {
            console.error("Error parsing template JSON:", parseError);
            setError(`Failed to parse template JSON: ${parseError.message}`);
            toast.error("Failed to parse the template file", {
              position: "top-center",
            });
          }
        };
        fileReader.onerror = (readError) => {
          console.error("Error reading file:", readError);
          setError(`Error reading file: ${readError}`);
          toast.error("Failed to read the template file", {
            position: "top-center",
          });
        };
        fileReader.readAsText(blob);
      } else {
        const errorText = `Failed to load template: ${res.status} ${res.statusText}`;
        console.error(errorText);
        setError(errorText);
        toast.error("Failed to load the template file", {
          position: "top-center",
        });
      }
    } catch (e) {
      console.error("Error loading template:", e);
      setError(e.message);
      toast.error(`Failed to load the template: ${e.message}`, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (link) loadRemoteFile(link);
  }, [link, loadRemoteFile]);

  const handleSavePdfTemplate = async (blob) => {
    // Store the blob for later use (e.g., in a save modal)
    blobRef.current = blob;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="loadingContainer">
        <div className="spinner"></div>
        <p>Loading template...</p>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="errorContainer">
        <h3>Error Loading Template</h3>
        <p>{error}</p>
        <button 
          className="retryButton" 
          onClick={() => loadRemoteFile(link)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        position: "relative"
      }}
    >
      {file && (
        <PDFEditorForExising
          file={file}
          onSavePdfTemplate={blob => {
            blobRef.current = blob;
            // Send the template to the server
            // You can add your save logic here
            toast.success("Template prepared for saving", {
              position: "top-center",
            });
          }}
          originalFileName={name}
        />
      )}
    </div>
  );
};

export default EditTemplate; 