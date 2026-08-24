"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/Utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import {
  getTutorSubjects,
  saveTutorProfile,
  uploadTutorTranscript,
  type CambridgeTranscriptLevel,
  type TeachingLevel,
  type TranscriptRecord,
} from "./_actions";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

const STEPS = [
  {
    number: 1,
    label: "Subjects",
    eyebrow: "01",
    title: "What do you teach?",
  },
  {
    number: 2,
    label: "Transcripts",
    eyebrow: "02",
    title: "Verify your results",
  },
  {
    number: 3,
    label: "Teaching level",
    eyebrow: "03",
    title: "Choose your level",
  },
  {
    number: 4,
    label: "Review",
    eyebrow: "04",
    title: "Check your details",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UploadStatus = "idle" | "uploading" | "success" | "error";

type TranscriptUpload = {
  id: string;
  fileName: string;
  transcriptType: "cambridge" | "additional";
  status: UploadStatus;
  transcript?: TranscriptRecord;
  error?: string;
};

type TutorSetupProps = {
  clerkId: string;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TutorSetup({ clerkId }: TutorSetupProps) {
  const [step, setStep] = useState(1);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");

  const [cambridgeLevel, setCambridgeLevel] =
    useState<CambridgeTranscriptLevel>("a_level");

  const [cambridgeUpload, setCambridgeUpload] =
    useState<TranscriptUpload | null>(null);

  const [additionalUploads, setAdditionalUploads] = useState<
    TranscriptUpload[]
  >([]);

  const [teachingLevel, setTeachingLevel] =
    useState<TeachingLevel>("a_level");

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load subjects                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadSubjects() {
      setSubjectsLoading(true);
      setSubjectsError("");

      const result = await getTutorSubjects();

      if (cancelled) return;

      if (!result.success) {
        setSubjectsError(result.error);
      } else {
        setSubjects(result.data);
      }

      setSubjectsLoading(false);
    }

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Derived state                                                            */
  /* ------------------------------------------------------------------------ */

  const allUploads = useMemo(
    () => [
      ...(cambridgeUpload ? [cambridgeUpload] : []),
      ...additionalUploads,
    ],
    [cambridgeUpload, additionalUploads],
  );

  const uploadedTranscripts = useMemo(
    () =>
      allUploads
        .filter(
          (upload): upload is TranscriptUpload & {
            transcript: TranscriptRecord;
          } =>
            upload.status === "success" && Boolean(upload.transcript),
        )
        .map((upload) => upload.transcript),
    [allUploads],
  );

  const cambridgeTranscriptUploaded =
    cambridgeUpload?.status === "success" &&
    Boolean(cambridgeUpload.transcript);

  /* ------------------------------------------------------------------------ */
  /* Validation                                                               */
  /* ------------------------------------------------------------------------ */

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (selectedSubjects.length === 0) {
        return "Select at least one subject to continue.";
      }

      if (selectedSubjects.length > 3) {
        return "You can select a maximum of three subjects.";
      }
    }

    if (currentStep === 2) {
      if (!cambridgeTranscriptUploaded) {
        return "Upload your official Cambridge transcript before continuing.";
      }

      const failedUpload = allUploads.find(
        (upload) => upload.status === "error",
      );

      if (failedUpload) {
        return "Fix or remove the failed transcript upload before continuing.";
      }

      const uploading = allUploads.some(
        (upload) => upload.status === "uploading",
      );

      if (uploading) {
        return "Wait for your transcript uploads to finish.";
      }
    }

    if (currentStep === 3) {
      if (
        cambridgeLevel === "o_level" &&
        teachingLevel !== "o_level"
      ) {
        return "An O-Level Cambridge transcript only permits O-Level teaching.";
      }
    }

    return null;
  }

  function goNext() {
    const error = validateStep(step);

    if (error) {
      setSubmitError(error);
      return;
    }

    setSubmitError("");
    setStep((current) => Math.min(current + 1, 4));
  }

  function goBack() {
    setSubmitError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  /* ------------------------------------------------------------------------ */
  /* Subject selection                                                        */
  /* ------------------------------------------------------------------------ */

  function toggleSubject(subject: string) {
    setSubmitError("");

    setSelectedSubjects((current) => {
      if (current.includes(subject)) {
        return current.filter((item) => item !== subject);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, subject];
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Upload                                                                   */
  /* ------------------------------------------------------------------------ */

  function validateFile(file: File): string | null {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Only PDF, JPEG, and PNG files are accepted.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "This file is larger than 10 MB. Please choose a smaller file.";
    }

    return null;
  }

  async function uploadFile(
    file: File,
    transcriptType: "cambridge" | "additional",
    uploadId: string,
  ) {
    const validationError = validateFile(file);

    if (validationError) {
      updateUpload(uploadId, transcriptType, {
        status: "error",
        error: validationError,
      });
      return;
    }

    updateUpload(uploadId, transcriptType, {
      status: "uploading",
      error: undefined,
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("transcript_type", transcriptType);

    const result = await uploadTutorTranscript(formData);

    if (!result.success) {
      updateUpload(uploadId, transcriptType, {
        status: "error",
        error: result.error,
      });
      return;
    }

    updateUpload(uploadId, transcriptType, {
      status: "success",
      transcript: result.data,
      error: undefined,
      fileName: result.data.original_filename || file.name,
    });
  }

  function updateUpload(
    uploadId: string,
    transcriptType: "cambridge" | "additional",
    patch: Partial<TranscriptUpload>,
  ) {
    if (transcriptType === "cambridge") {
      setCambridgeUpload((current) =>
        current?.id === uploadId
          ? {
              ...current,
              ...patch,
            }
          : current,
      );
      return;
    }

    setAdditionalUploads((current) =>
      current.map((upload) =>
        upload.id === uploadId
          ? {
              ...upload,
              ...patch,
            }
          : upload,
      ),
    );
  }

  function handleCambridgeFile(file: File | undefined) {
    if (!file) return;

    const id = crypto.randomUUID();

    setCambridgeUpload({
      id,
      fileName: file.name,
      transcriptType: "cambridge",
      status: "idle",
    });

    void uploadFile(file, "cambridge", id);
  }

  function addAdditionalTranscript() {
    const id = crypto.randomUUID();

    setAdditionalUploads((current) => [
      ...current,
      {
        id,
        fileName: "",
        transcriptType: "additional",
        status: "idle",
      },
    ]);
  }

  function handleAdditionalFile(
    uploadId: string,
    file: File | undefined,
  ) {
    if (!file) return;

    updateUpload(uploadId, "additional", {
      fileName: file.name,
      status: "idle",
      error: undefined,
    });

    void uploadFile(file, "additional", uploadId);
  }

  function removeUpload(
    uploadId: string,
    transcriptType: "cambridge" | "additional",
  ) {
    if (transcriptType === "cambridge") {
      setCambridgeUpload(null);
      return;
    }

    setAdditionalUploads((current) =>
      current.filter((upload) => upload.id !== uploadId),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Teaching-level gating                                                    */
  /* ------------------------------------------------------------------------ */

  function handleCambridgeLevelChange(
    level: CambridgeTranscriptLevel,
  ) {
    setCambridgeLevel(level);
    setSubmitError("");

    if (level === "o_level") {
      setTeachingLevel("o_level");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit() {
    setSubmitError("");

    const validationError =
      validateStep(1) ??
      validateStep(2) ??
      validateStep(3);

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    if (!cambridgeTranscriptUploaded) {
      setSubmitError("A Cambridge transcript is required.");
      setStep(2);
      return;
    }

    setSubmitting(true);

    const result = await saveTutorProfile({
      subjects: selectedSubjects,
      cambridge_transcript_level: cambridgeLevel,
      teaching_level: teachingLevel,
      transcripts: uploadedTranscripts,
    });

    if (!result.success) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    window.location.assign(
      "/dashboard/tutor?onboarding=complete",
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-stamp">
                Tutor verification / file 001
              </div>

              <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                Set up your tutor profile
              </h1>
            </div>

            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-ink/10 bg-card px-3 py-2 sm:flex">
              <ShieldCheck className="h-4 w-4 text-ledger" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/65">
                Verification required
              </span>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-ink/60">
            Tell us what you teach, upload your academic records, and
            confirm the level you are qualified to teach.
          </p>
        </header>

        {/* Step tracker */}
        <StepTracker step={step} onStepClick={setStep} />

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <SubjectsStep
                  subjects={subjects}
                  selectedSubjects={selectedSubjects}
                  loading={subjectsLoading}
                  error={subjectsError}
                  onRetry={() => {
                    setSubjectsError("");
                    setSubjectsLoading(true);

                    void getTutorSubjects().then((result) => {
                      if (!result.success) {
                        setSubjectsError(result.error);
                      } else {
                        setSubjects(result.data);
                      }

                      setSubjectsLoading(false);
                    });
                  }}
                  onToggle={toggleSubject}
                />
              )}

              {step === 2 && (
                <TranscriptsStep
                  cambridgeLevel={cambridgeLevel}
                  cambridgeUpload={cambridgeUpload}
                  additionalUploads={additionalUploads}
                  onCambridgeLevelChange={
                    handleCambridgeLevelChange
                  }
                  onCambridgeFile={handleCambridgeFile}
                  onAdditionalFile={handleAdditionalFile}
                  onAddAdditional={addAdditionalTranscript}
                  onRemove={removeUpload}
                />
              )}

              {step === 3 && (
                <TeachingLevelStep
                  cambridgeLevel={cambridgeLevel}
                  teachingLevel={teachingLevel}
                  onChange={setTeachingLevel}
                />
              )}

              {step === 4 && (
                <ReviewStep
                  selectedSubjects={selectedSubjects}
                  cambridgeLevel={cambridgeLevel}
                  teachingLevel={teachingLevel}
                  transcripts={uploadedTranscripts}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5"
            >
              <div
                role="alert"
                className="flex items-start gap-3 border border-stamp/30 bg-stamp/5 px-4 py-3 text-sm text-ink"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-stamp" />
                <span>{submitError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-dashed border-ink/15 pt-6">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <Button
                type="button"
                variant="stamp"
                onClick={goNext}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="stamp"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for verification
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink/35">
          Parho / Tutor verification record / {clerkId.slice(0, 8)}
        </div>
      </div>
    </main>
  );
}

/* ========================================================================== */
/* Step tracker                                                               */
/* ========================================================================== */

function StepTracker({
  step,
  onStepClick,
}: {
  step: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-[19px] hidden h-px bg-ink/10 sm:block" />

      <div className="relative grid grid-cols-4 gap-1 sm:gap-3">
        {STEPS.map((item) => {
          const active = item.number === step;
          const complete = item.number < step;

          return (
            <button
              key={item.number}
              type="button"
              disabled={item.number > step}
              onClick={() => {
                if (item.number <= step) {
                  onStepClick(item.number);
                }
              }}
              className={cn(
                "group text-left",
                item.number > step && "cursor-default",
              )}
            >
              <div
                className={cn(
                  "relative mx-auto flex h-10 w-10 items-center justify-center border bg-page font-mono text-xs font-bold transition-colors sm:mx-0",
                  active
                    ? "border-stamp bg-stamp text-white"
                    : complete
                      ? "border-ledger bg-ledger text-white"
                      : "border-ink/15 text-ink/45",
                )}
              >
                {complete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  item.eyebrow
                )}
              </div>

              <div className="mt-2 hidden sm:block">
                <div
                  className={cn(
                    "font-mono text-[9px] font-bold uppercase tracking-wider",
                    active ? "text-stamp" : "text-ink/40",
                  )}
                >
                  {item.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Step 1                                                                     */
/* ========================================================================== */

function SubjectsStep({
  subjects,
  selectedSubjects,
  loading,
  error,
  onRetry,
  onToggle,
}: {
  subjects: string[];
  selectedSubjects: string[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onToggle: (subject: string) => void;
}) {
  return (
    <section>
      <SectionHeading
        eyebrow="Step 01 / Subjects"
        title="Choose your subjects"
        description="Select the subjects you are prepared to tutor. You can list up to three."
      />

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/45">
            Subject taxonomy
          </div>

          <div
            className={cn(
              "font-mono text-xs font-bold",
              selectedSubjects.length === 3
                ? "text-stamp"
                : "text-ledger",
            )}
          >
            {selectedSubjects.length} of 3 selected
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center px-6">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-ink/45">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading subjects...
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-stamp" />
            <p className="mt-3 text-sm text-ink/65">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onRetry}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const selected = selectedSubjects.includes(subject);
              const disabled =
                !selected && selectedSubjects.length >= 3;

              return (
                <button
                  key={subject}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(subject)}
                  className={cn(
                    "flex min-h-16 items-center gap-3 bg-card px-5 py-4 text-left transition-colors",
                    selected && "bg-ledger/5",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border",
                      selected
                        ? "border-ledger bg-ledger text-white"
                        : "border-ink/20 bg-page",
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>

                  <span
                    className={cn(
                      "text-sm",
                      selected
                        ? "font-medium text-ink"
                        : "text-ink/65",
                    )}
                  >
                    {subject}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}

/* ========================================================================== */
/* Step 2                                                                     */
/* ========================================================================== */

function TranscriptsStep({
  cambridgeLevel,
  cambridgeUpload,
  additionalUploads,
  onCambridgeLevelChange,
  onCambridgeFile,
  onAdditionalFile,
  onAddAdditional,
  onRemove,
}: {
  cambridgeLevel: CambridgeTranscriptLevel;
  cambridgeUpload: TranscriptUpload | null;
  additionalUploads: TranscriptUpload[];
  onCambridgeLevelChange: (
    level: CambridgeTranscriptLevel,
  ) => void;
  onCambridgeFile: (file: File | undefined) => void;
  onAdditionalFile: (
    id: string,
    file: File | undefined,
  ) => void;
  onAddAdditional: () => void;
  onRemove: (
    id: string,
    type: "cambridge" | "additional",
  ) => void;
}) {
  return (
    <section>
      <SectionHeading
        eyebrow="Step 02 / Transcripts"
        title="Show us your academic record"
        description="Your Cambridge transcript is required for verification. Additional records are optional."
      />

      <div className="mt-6 space-y-5">
        <Card className="overflow-hidden">
          <div className="border-b border-ink/10 bg-stamp/5 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-stamp/25 bg-card text-stamp">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-stamp">
                  Required
                </div>
                <h2 className="mt-1 font-display text-xl text-ink">
                  Official Cambridge Transcript
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            <div>
              <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-ink/50">
                Transcript level
              </label>

              <div className="grid grid-cols-2 gap-2">
                <LevelChoice
                  selected={cambridgeLevel === "o_level"}
                  title="O-Level"
                  description="Cambridge O-Level results"
                  onClick={() =>
                    onCambridgeLevelChange("o_level")
                  }
                />

                <LevelChoice
                  selected={cambridgeLevel === "a_level"}
                  title="A-Level"
                  description="Cambridge A-Level results"
                  onClick={() =>
                    onCambridgeLevelChange("a_level")
                  }
                />
              </div>
            </div>

            <UploadSlot
              upload={cambridgeUpload}
              required
              onFile={onCambridgeFile}
              onRemove={() =>
                cambridgeUpload &&
                onRemove(cambridgeUpload.id, "cambridge")
              }
            />
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/45">
                Optional
              </div>
              <h2 className="mt-1 font-display text-xl text-ink">
                Additional transcripts
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Add school records or other academic transcripts.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddAdditional}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add transcript
            </Button>
          </div>

          {additionalUploads.length > 0 && (
            <div className="border-t border-ink/10">
              {additionalUploads.map((upload, index) => (
                <div
                  key={upload.id}
                  className="border-b border-dashed border-ink/10 px-5 py-5 last:border-b-0 sm:px-6"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/45">
                      Additional transcript {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(upload.id, "additional")
                      }
                      className="text-ink/35 transition-colors hover:text-stamp"
                      aria-label="Remove transcript"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <UploadSlot
                    upload={upload}
                    onFile={(file) =>
                      onAdditionalFile(upload.id, file)
                    }
                    onRemove={() =>
                      onRemove(upload.id, "additional")
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-ink/40">
          <FileCheck2 className="h-3.5 w-3.5 text-ledger" />
          PDF, JPEG, PNG / maximum 10 MB per file
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Upload slot                                                                */
/* ========================================================================== */

function UploadSlot({
  upload,
  required = false,
  onFile,
  onRemove,
}: {
  upload: TranscriptUpload | null;
  required?: boolean;
  onFile: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const inputId = `transcript-${upload?.id ?? "new"}`;

  if (upload?.status === "success" && upload.transcript) {
    return (
      <div className="flex items-center gap-3 border border-ledger/25 bg-ledger/5 px-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ledger text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">
            {upload.fileName}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ledger">
            Uploaded successfully
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-ink/35 hover:text-stamp"
          aria-label="Remove uploaded transcript"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (upload?.status === "uploading") {
    return (
      <div className="border border-ledger/20 bg-ledger/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-ledger/20 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-ledger" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">
              {upload.fileName}
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-ledger">
              Uploading and verifying file...
            </div>

            <div className="mt-3 h-1 overflow-hidden bg-ledger/10">
              <motion.div
                className="h-full bg-ledger"
                initial={{ width: "0%" }}
                animate={{ width: "92%" }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (upload?.status === "error") {
    return (
      <div className="border border-stamp/25 bg-stamp/5 px-4 py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-stamp" />

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">
              {upload.fileName || "Upload failed"}
            </div>
            <p className="mt-1 text-xs leading-5 text-stamp">
              {upload.error}
            </p>

            <div className="mt-3 flex gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center border border-stamp bg-card px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-stamp hover:bg-stamp hover:text-white"
              >
                Try another file
              </label>

              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-ink/45 hover:text-stamp"
              >
                Remove
              </button>
            </div>

            <input
              id={inputId}
              type="file"
              accept={ACCEPTED_FILE_EXTENSIONS}
              className="sr-only"
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-center gap-4 border border-dashed border-ink/20 bg-page px-4 py-5 transition-colors hover:border-ledger/50 hover:bg-ledger/5",
        required && "min-h-28",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink/10 bg-card text-ink/45 transition-colors group-hover:border-ledger/20 group-hover:text-ledger">
        <Upload className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">
          {required
            ? "Upload official Cambridge transcript"
            : "Upload transcript"}
        </div>

        <div className="mt-1 text-xs text-ink/45">
          PDF, JPEG, or PNG · maximum 10 MB
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider text-ledger sm:flex">
        Browse
        <ChevronDown className="h-3 w-3 -rotate-90" />
      </div>

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}

/* ========================================================================== */
/* Step 3                                                                     */
/* ========================================================================== */

function TeachingLevelStep({
  cambridgeLevel,
  teachingLevel,
  onChange,
}: {
  cambridgeLevel: CambridgeTranscriptLevel;
  teachingLevel: TeachingLevel;
  onChange: (level: TeachingLevel) => void;
}) {
  const options: Array<{
    value: TeachingLevel;
    title: string;
    description: string;
  }> = [
    {
      value: "o_level",
      title: "O-Level",
      description: "Teach O-Level students.",
    },
    {
      value: "a_level",
      title: "A-Level",
      description: "Teach A-Level students.",
    },
    {
      value: "both",
      title: "Both",
      description: "Teach both O-Level and A-Level students.",
    },
  ];

  return (
    <section>
      <SectionHeading
        eyebrow="Step 03 / Teaching level"
        title="What level can you teach?"
        description="Your Cambridge qualification determines which teaching levels you can select."
      />

      <Card className="mt-6">
        <div className="border-b border-ink/10 bg-page px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ledger" />

            <p className="text-sm leading-6 text-ink/65">
              Your declared Cambridge transcript is{" "}
              <strong className="font-semibold text-ink">
                {cambridgeLevel === "o_level"
                  ? "O-Level"
                  : "A-Level"}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {options.map((option) => {
            const disabled =
              cambridgeLevel === "o_level" &&
              option.value !== "o_level";

            const selected = teachingLevel === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex w-full items-start gap-4 border p-4 text-left transition-colors",
                  selected
                    ? "border-ledger bg-ledger/5"
                    : "border-ink/10 bg-card",
                  disabled &&
                    "cursor-not-allowed bg-ink/[0.02] opacity-65",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-ledger"
                      : "border-ink/25",
                  )}
                >
                  {selected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-ledger" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-lg text-ink">
                      {option.title}
                    </span>

                    {disabled && (
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-stamp">
                        Locked
                      </span>
                    )}
                  </span>

                  <span className="mt-1 block text-sm text-ink/50">
                    {disabled
                      ? "Unlocks with an A-Level Cambridge transcript."
                      : option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

/* ========================================================================== */
/* Step 4                                                                     */
/* ========================================================================== */

function ReviewStep({
  selectedSubjects,
  cambridgeLevel,
  teachingLevel,
  transcripts,
}: {
  selectedSubjects: string[];
  cambridgeLevel: CambridgeTranscriptLevel;
  teachingLevel: TeachingLevel;
  transcripts: TranscriptRecord[];
}) {
  return (
    <section>
      <SectionHeading
        eyebrow="Step 04 / Review"
        title="Review your record"
        description="Check everything once before submitting your profile for verification."
      />

      <div className="mt-6 space-y-4">
        <ReviewCard
          label="Subjects"
          icon={<FileText className="h-4 w-4" />}
        >
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map((subject) => (
              <span
                key={subject}
                className="border border-ledger/20 bg-ledger/5 px-3 py-1.5 text-xs font-medium text-ink"
              >
                {subject}
              </span>
            ))}
          </div>
        </ReviewCard>

        <ReviewCard
          label="Cambridge transcript"
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-ink/65">
              Cambridge {cambridgeLevel === "o_level" ? "O-Level" : "A-Level"}
            </span>

            <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ledger">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Uploaded
            </span>
          </div>
        </ReviewCard>

        <ReviewCard
          label="Teaching level"
          icon={<FileCheck2 className="h-4 w-4" />}
        >
          <span className="font-display text-xl text-ink">
            {teachingLevel === "o_level"
              ? "O-Level"
              : teachingLevel === "a_level"
                ? "A-Level"
                : "Both"}
          </span>
        </ReviewCard>

        <ReviewCard
          label="Transcripts"
          icon={<Upload className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {transcripts.map((transcript) => (
              <div
                key={`${transcript.storage_path}-${transcript.original_filename}`}
                className="flex items-center gap-3 border-b border-dashed border-ink/10 pb-2 last:border-0 last:pb-0"
              >
                <FileText className="h-4 w-4 shrink-0 text-ink/35" />

                <span className="min-w-0 flex-1 truncate text-sm text-ink/65">
                  {transcript.original_filename}
                </span>

                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-ledger">
                  {transcript.transcript_type}
                </span>
              </div>
            ))}
          </div>
        </ReviewCard>

        <div className="flex items-start gap-3 border border-ledger/20 bg-ledger/5 px-4 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ledger" />

          <p className="text-xs leading-5 text-ink/60">
            Your profile will enter verification after submission.
            You will be able to continue to your tutor dashboard while
            the verification process is pending.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Shared components                                                          */
/* ========================================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-stamp">
        {eyebrow}
      </div>

      <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
        {description}
      </p>
    </div>
  );
}

function LevelChoice({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-4 py-4 text-left transition-colors",
        selected
          ? "border-ledger bg-ledger/5"
          : "border-ink/10 bg-card hover:border-ink/20",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border",
            selected ? "border-ledger" : "border-ink/20",
          )}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-ledger" />
          )}
        </span>

        <span className="font-display text-lg text-ink">
          {title}
        </span>
      </div>

      <p className="mt-2 pl-6 text-[11px] leading-4 text-ink/45">
        {description}
      </p>
    </button>
  );
}

function ReviewCard({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-dashed border-ink/10 pb-3">
        <span className="text-ledger">{icon}</span>

        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink/45">
          {label}
        </span>
      </div>

      {children}
    </Card>
  );
}