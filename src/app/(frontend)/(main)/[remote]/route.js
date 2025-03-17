import prisma from "@/lib/prisma";
import { getSignedUrl } from "@/lib/s3";
import { redirect, NextResponse } from "next/navigation";

export async function GET(req, { params }) {
  const remote = params.remote;

  const file = await prisma.workerDocument.findFirst({
    where: {
      slug: remote,
    },
    select: {
      documentAsset: { select: { filePath: true } },
      type: true,
      isRemoteDocSubmitted: true,
    },
  });

  if (!file) {
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 }
    );
  }

  if (!file.documentAsset?.filePath) {
    return NextResponse.json(
      { message: "Document file not found" },
      { status: 404 }
    );
  }

  if (file.type === "REMOTE_DOCUMENT") {
    if (file.isRemoteDocSubmitted) {
      const url = await getSignedUrl(file.documentAsset.filePath);
      return redirect(url);
    } else {
      return redirect(`/${remote}/remote-doc`);
    }
  } else {
    const url = await getSignedUrl(file.documentAsset.filePath);
    return redirect(url);
  }
}
