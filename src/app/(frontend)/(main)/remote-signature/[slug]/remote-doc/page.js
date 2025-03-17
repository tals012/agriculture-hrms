import React from "react";
import WorkerRemoteDocument from "@/containers/workers/remoteDoc";

async function WorkerRemoteDocumentPage({ params }) {
  if (!params.slug) {
    return <div>Document not found!</div>;
  }
  return (
    <div>
      <WorkerRemoteDocument slug={params.slug} />
    </div>
  );
}

export default WorkerRemoteDocumentPage;
