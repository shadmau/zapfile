"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  Copy,
  AlertTriangle,
  Github,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Check file size (150MB limit)
    const MAX_SIZE = 150 * 1024 * 1024; // 150MB
    if (file.size > MAX_SIZE) {
      alert(`File size exceeds 150MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);

      const responseText = await uploadPromise;
      const result = JSON.parse(responseText);
      const fullUrl = `${window.location.origin}/f/${result.hash}`;
      setUploadedUrl(fullUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCopyLink = async () => {
    if (!uploadedUrl) return;

    try {
      await navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950">
      {/* Warning Banner */}
      <div className="border-b border-yellow-900/50 bg-yellow-950/30 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-yellow-500">
                Experimental
              </span>
              <span className="text-yellow-200/80">•</span>
              <span className="text-yellow-200/90">
                Designed for Claude Code Web
              </span>
              <span className="text-yellow-200/80">•</span>
              <button
                onClick={() => setShowSetupInfo(!showSetupInfo)}
                className="inline-flex items-center gap-1 text-yellow-400 underline hover:text-yellow-300"
              >
                <Settings className="h-3.5 w-3.5" />
                Setup
              </button>
            </div>
          </div>
          <a
            href="https://github.com/shadmau/zapfile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-yellow-400 hover:text-yellow-300"
            title="Self-host on GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Setup Info */}
      {showSetupInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-4"
        >
          <div className="mx-auto max-w-4xl">
            <h3 className="mb-2 font-semibold text-zinc-100">
              Claude Code Web Setup
            </h3>
            <p className="mb-3 text-sm text-zinc-400">
              To allow Claude Code Web to download files, you need to either:
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-orange-400">1.</span>
                <span>
                  Add{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-orange-400">
                    zapfile.dev
                  </code>{" "}
                  to your trusted environment in Claude Code settings
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-400">2.</span>
                <span>
                  Or enable full network access in your Claude Code environment
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              If you feel unsure, you can{" "}
              <a
                href="https://github.com/shadmau/zapfile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 underline hover:text-orange-300"
              >
                self-host this service
              </a>
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 shadow-lg shadow-orange-500/30">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                  <path d="M12 18v-6"></path>
                  <path d="m9 15 3 3 3-3"></path>
                </svg>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-zinc-50">
                Zapfile
              </h1>
            </div>
            <p className="text-lg text-zinc-400">
              Quick file sharing for Claude Code Web
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Upload Zone */}
            <div
              className={cn(
                "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
                dragOver
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900/50",
                uploading && "pointer-events-none opacity-60"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!uploading ? handleClickUpload : undefined}
            >
              <div className="flex flex-col items-center">
                {uploading ? (
                  <>
                    <div className="mb-6 rounded-full bg-orange-500/20 p-6">
                      <Loader2 className="h-12 w-12 animate-spin text-orange-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-100">
                      Uploading {fileName}...
                    </h3>
                    <p className="mb-4 text-zinc-400">{uploadProgress}%</p>
                    {/* Progress Bar */}
                    <div className="w-full max-w-xs overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </>
                ) : dragOver ? (
                  <>
                    <div className="mb-6 rounded-full bg-orange-500/20 p-6">
                      <FileText className="h-12 w-12 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100">
                      Drop your file here
                    </h3>
                  </>
                ) : (
                  <>
                    <div className="mb-6 rounded-full bg-zinc-800 p-6">
                      <Upload className="h-12 w-12 text-zinc-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-100">
                      Drop your file or click to browse
                    </h3>
                    <p className="text-zinc-400">Any file type supported</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Link Display */}
            {uploadedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Your file is ready!
                  </h3>
                  <Check className="h-5 w-5 text-orange-500" />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Share this link:
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 p-3">
                      <div className="truncate font-mono text-sm text-zinc-300">
                        {uploadedUrl}
                      </div>
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="flex-shrink-0 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-orange-900/50 bg-orange-950/30 p-4 text-sm text-orange-300">
                  <strong>Note:</strong> Share this link with Claude Code Web
                  for it to download the file.
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
