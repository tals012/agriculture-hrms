"use client";
import React, { useEffect, useState } from "react";
import SignInHandler from "./SignInHandler";
import FormEditor from "./FormEditor";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getFormForRemoteDocSignIn } from "@/app/(backend)/actions/workers/digitalForm/getFormForRemoteDocSignIn";
import { getSignedUrl } from "@/lib/s3";

function WorkerRemoteDocument({ slug, isAuthenticated = false, sessionSlug }) {
  const [isSessionValid, setIsSessionValid] = useState(isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("other");

  const router = useRouter();

  const init = async (_slug) => {
    try {
      setIsLoading(true);
      const res = await getFormForRemoteDocSignIn({
        slug: _slug,
      });
      if (!res.ok) {
        if (res.alreadySubmitted) {
          // if (sessionSlug) {
          //   router.replace(`/worker-documents/${sessionSlug}/documents`);
          // } else {
            const url = await getSignedUrl(res.documentAsset.filePath);
            // window.open(url, "_blank");
            window.location.href = url;
          // }
        } else {
          toast.error(res.message, {
            position: "top-center",
          });
        }
      } else {
        setRequiresPassword(res.data.isRemoteDocPasswordProtected);
        setCountryCode(res.data.countryCode || "other");
        setHasLoaded(true);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      init(slug);
    }
  }, [slug]);

  if (isLoading || !hasLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spinner />
      </div>
    );
  }

  console.log("WorkerRemoteDocument - countryCode:", countryCode);

  return (
    <div>
      {isSessionValid ? (
        <FormEditor
          slug={slug}
          sessionSlug={sessionSlug}
          countryCode={countryCode}
        />
      ) : (
        <SignInHandler
          slug={slug}
          requiresPassword={requiresPassword}
          onAuthSuccess={() => {
            setIsSessionValid(true);
          }}
          countryCode={countryCode}
        />
      )}
    </div>
  );
}

export default WorkerRemoteDocument;
