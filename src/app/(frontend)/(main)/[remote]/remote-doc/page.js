import WorkerRemoteDocument from "@/containers/workers/remoteDoc";
import React from "react";

async function WorkerRemoteDocumentPage({ params }) {
  if (!params.remote) {
    return <div>Document not found!</div>;
  }
  return (
    <div>
      <WorkerRemoteDocument slug={params.remote} />
    </div>
  );
}

export default WorkerRemoteDocumentPage;
