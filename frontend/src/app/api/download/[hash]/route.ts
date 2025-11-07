import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    const clientIp =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown";

    const response = await fetch(`${BACKEND_URL}/api/download/${hash}`, {
      headers: {
        "X-Forwarded-For": clientIp,
        "X-Real-IP": clientIp,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/html")) {
        const html = await response.text();
        return new NextResponse(html, {
          status: response.status,
          headers: { "Content-Type": "text/html" },
        });
      }

      const error = await response.text();
      return NextResponse.json(
        { error: error || "Download failed" },
        { status: response.status }
      );
    }

    // Stream the file
    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const contentType = response.headers.get("content-type");

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": contentDisposition || "attachment",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
