import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import Spinner from "@/components/spinner";
import FormEditor from "@/containers/signedForm/formEditor";

import { getFormForRemoteDocSignIn } from "@/app/(backend)/actions/workers/digitalForm/getFormForRemoteDocSignIn";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";
import { markRemoteDocAsRead } from "@/app/(backend)/actions/workers/digitalForm/markRemoteDocAsRead";
import { submitRemoteDoc } from "@/app/(backend)/actions/workers/digitalForm/submitRemoteDoc";
import { getSignedUrl } from "@/lib/s3";
// import { createNotification } from "@/app/actions/notifications/createNotification";

function RemoteFormEditor({ slug, sessionSlug, countryCode }) {
  const [file, setFile] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const router = useRouter();

  const _markRemoteDocAsRead = async () => {
    try {
      await markRemoteDocAsRead({ slug });
    } catch (e) {}
  };

  const loadRemoteFile = React.useCallback(async (_link) => {
    try {
      const res = await fetch(_link);

      if (res.ok) {
        const json = await res.json();
        setFile(json);
      } else {
        toast.error("Failed to load the file.", {
          position: "top-center",
        });
      }
    } catch (e) {
      toast.error("Failed to load the file.", {
        position: "top-center",
      });
    }
  }, []);

  const init = async (_slug) => {
    try {
      setIsLoading(true);
      _markRemoteDocAsRead();
      const res = await getFormForRemoteDocSignIn({
        slug: _slug,
      });
      if (res.ok) {
        await loadRemoteFile(res.data.link);
        setData({ workerId: res.data.workerId });
      } else {
        if (res.alreadySubmitted) {
          router.push(`/remote-signature/${_slug}/thank-you`);
        } else {
          toast.error(res.message, {
            position: "top-center",
          });
        }
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const onSave = React.useCallback(
    async (blob) => {
      try {
        setIsLoading(true);
        const singedUploadUrlRes = await createSignedUploadURLs({
          files: [{ ext: ".pdf", type: "PDF" }],
        });

        if (!singedUploadUrlRes.ok) {
          throw new Error("Failed to create signed upload URLs");
        }

        const singedUploadUrl =
          singedUploadUrlRes.data[0].assetStorageFileUploadURL;
        const templateAssetId = singedUploadUrlRes.data[0].assetId;

        const uploadRes = await fetch(singedUploadUrl, {
          method: "PUT",
          body: blob,
        });
        if (!uploadRes.ok) {
          throw new Error("Failed to upload the document");
        }

        const res = await submitRemoteDoc({
          slug,
          assetId: templateAssetId,
        });

        if (res.ok) {
          toast.success(res.message, {
            position: "top-center",
          });

          // if (data?.foreignWorkerId) {
          //   // Create the notification with the link to the document screen
          //   await createNotification({
          //     title: "נחתם מסמך דיגיטלי",
          //     body: `מסמך דיגיטלי נחתם על ידי העובד. צפה במסמכים <a href="/admin/workers?worker=${data.foreignWorkerId}&type=documents">כאן</a>`,
          //     target: "WORKER",
          //     targetId: data.foreignWorkerId,
          //   });
          // }

          // Redirect back to the documents table
          // if (sessionSlug) {
          //   router.replace(`/worker-documents/${sessionSlug}/documents`);
          // } else {
          // const url = await getSignedUrl(res.documentAsset.filePath);
          // window.open(url, "_blank");
          // window.location.href = url;
          // }
          router.push(`/remote-signature/${slug}/thank-you`);
        } else {
          toast.error(res.message, {
            position: "top-center",
          });
        }
      } catch (e) {
        toast.error(e.message || "Something went wrong. Please try again!", {
          position: "top-center",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [slug, router, data, sessionSlug]
  );

  React.useEffect(() => {
    if (slug) {
      init(slug);
    }
  }, [slug]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        backgroundColor: "#F6F6F6",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1520px",
          marginTop: "20px",
        }}
      >
        {!!file && data && !isLoading && (
          <FormEditor
            key={file.id}
            file={file}
            foreignWorkerId={data.workerId}
            source={"REMOTE_WORKER"}
            onSave={(d) => onSave(d)}
            countryCode={countryCode}
          />
        )}
      </div>
      {isLoading && <Spinner size={20} />}
    </div>
  );
}

export default RemoteFormEditor;
