import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  Edit01Icon,
  Image01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRequest } from "@/hooks/useRequest";
import { apiRequest, uploadAdminImage } from "@/lib/api";

type TemplateField = {
  key: string;
  promptToken: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "email" | "number" | "date";
  required: boolean;
  defaultValue?: string;
};
type TemplateFieldRecord = Omit<
  TemplateField,
  "promptToken" | "defaultValue"
> & {
  promptToken: string | null;
  defaultValue: string | null;
};
type ImageInput = {
  key: string;
  label: string;
  role: "subject";
  required: boolean;
  quantity: number;
  assetId?: string | null;
};
type TemplateVersion = {
  version: number;
  priceMinor: number;
  currency: string;
  fields: TemplateFieldRecord[];
  imageInputs: ImageInput[];
  promptTemplate: string;
  model: string;
  modelSettings: Record<string, unknown>;
};
type TemplateRecord = {
  _id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  tag: string | null;
  institutionEnabled?: boolean;
  previewAssetId?: string | null;
  preview?: { url: string; expiresAt: string };
  visible: boolean;
  currentVersion: number;
  versions: TemplateVersion[];
};
type TemplateList = { templates: TemplateRecord[] };
type TemplateDraft = {
  name: string;
  category: string;
  description: string;
  tag: string;
  institutionEnabled: boolean;
  priceNaira: string;
  fields: TemplateField[];
  imageInputs: ImageInput[];
  promptTemplate: string;
  model: "gpt-image-2";
  size: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality: "low" | "medium" | "high" | "auto";
  outputFormat: "png" | "jpeg" | "webp";
};

const blankField: TemplateField = {
  key: "displayWord",
  promptToken: "[DISPLAY WORD]",
  label: "Display word",
  placeholder: "THE ENGINEER",
  type: "text",
  required: true,
};
const blankImageInput: ImageInput = {
  key: "subject",
  label: "Your photo",
  role: "subject",
  required: true,
  quantity: 1,
};
const blankDraft: TemplateDraft = {
  name: "",
  category: "Invitation",
  description: "",
  tag: "",
  institutionEnabled: false,
  priceNaira: "1000",
  fields: [{ ...blankField }],
  imageInputs: [{ ...blankImageInput }],
  promptTemplate:
    "Create a premium editorial graduation design. Include the exact title [DISPLAY WORD].",
  model: "gpt-image-2",
  size: "1024x1536",
  quality: "high",
  outputFormat: "png",
};

function draftToDefinition(draft: TemplateDraft, editing: boolean) {
  const version = {
    priceMinor: Math.round(Number(draft.priceNaira) * 100),
    currency: "NGN",
    imageInputs: draft.imageInputs,
    fields: draft.fields,
    promptTemplate: draft.promptTemplate,
    model: draft.model,
    modelSettings: {
      size: draft.size,
      quality: draft.quality,
      outputFormat: draft.outputFormat,
    },
  };
  const metadata = {
    name: draft.name,
    category: draft.category,
    description: draft.description,
    tag: draft.tag || null,
    institutionEnabled: draft.institutionEnabled,
  };
  return editing ? { metadata, version } : { ...metadata, version };
}

function definitionToDraft(value: Record<string, any>): TemplateDraft {
  const metadata = value.metadata ?? value;
  const version = value.version ?? {};
  return {
    ...blankDraft,
    name: metadata.name ?? "",
    category: metadata.category ?? "Invitation",
    description: metadata.description ?? "",
    tag: metadata.tag ?? "",
    institutionEnabled: Boolean(metadata.institutionEnabled),
    priceNaira:
      version.priceMinor === undefined
        ? "1000"
        : String(version.priceMinor / 100),
    fields: (version.fields ?? []).map(
      (field: Partial<TemplateFieldRecord>) => ({
        ...blankField,
        ...field,
        promptToken: field.promptToken ?? `{{${field.key ?? "field"}}}`,
        defaultValue:
          typeof field.defaultValue === "string"
            ? field.defaultValue
            : undefined,
      }),
    ),
    imageInputs: (version.imageInputs ?? [])
      .filter((input: ImageInput) => input.role === "subject")
      .map((input: ImageInput) => ({ ...input })),
    promptTemplate: version.promptTemplate ?? "",
    model: "gpt-image-2",
    size: version.modelSettings?.size ?? "auto",
    quality: version.modelSettings?.quality ?? "auto",
    outputFormat: version.modelSettings?.outputFormat ?? "png",
  };
}

function validateImageFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be 10 MB or smaller.");
  }
}

export function TemplatesPage() {
  const templates = useRequest<TemplateList>("admin/templates", {
    templates: [],
  });
  const [editingId, setEditingId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"form" | "json">("form");
  const [draft, setDraft] = useState<TemplateDraft>({ ...blankDraft });
  const [jsonValue, setJsonValue] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewAssetId, setPreviewAssetId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function resetEditor() {
    setEditorOpen(false);
    setEditingId("");
    setEditorMode("form");
    setDraft({
      ...blankDraft,
      fields: [{ ...blankField }],
      imageInputs: [{ ...blankImageInput }],
    });
    setJsonValue("");
    setPreviewFile(null);
    setPreviewAssetId("");
    setPreviewUrl("");
  }

  function startCreate() {
    resetEditor();
    setEditorOpen(true);
    setError("");
    setNotice("");
  }

  function startEdit(template: TemplateRecord) {
    const current = template.versions.find(
      (version) => version.version === template.currentVersion,
    );
    if (!current) {
      setError("This template has no active version to edit.");
      return;
    }
    const definition = {
      metadata: {
        name: template.name,
        category: template.category,
        description: template.description,
        tag: template.tag,
        institutionEnabled: Boolean(template.institutionEnabled),
        previewAssetId: template.previewAssetId ?? null,
      },
      version: {
        priceMinor: current.priceMinor,
        currency: current.currency,
        imageInputs: current.imageInputs,
        fields: current.fields,
        promptTemplate: current.promptTemplate,
        model: current.model,
        modelSettings: current.modelSettings,
      },
    };
    setEditingId(template._id);
    setEditorOpen(true);
    setDraft(definitionToDraft(definition));
    setJsonValue(JSON.stringify(definition, null, 2));
    setPreviewFile(null);
    setPreviewAssetId(template.previewAssetId ?? "");
    setPreviewUrl(template.preview?.url ?? "");
    setEditorMode("form");
    setError("");
    setNotice("");
  }

  function switchEditorMode(mode: "form" | "json") {
    try {
      if (mode === "json") {
        setJsonValue(
          JSON.stringify(draftToDefinition(draft, Boolean(editingId)), null, 2),
        );
      } else {
        setDraft(definitionToDraft(JSON.parse(jsonValue)));
      }
      setEditorMode(mode);
      setError("");
    } catch {
      setError("Fix the JSON before switching back to the form editor.");
    }
  }

  async function saveDefinition() {
    setBusy(true);
    setError("");
    setNotice("Preparing template and validating image inputs…");
    let metadataSaved = false;
    try {
      const parsed = (
        editorMode === "form"
          ? draftToDefinition(draft, Boolean(editingId))
          : JSON.parse(jsonValue)
      ) as Record<string, any>;
      if (editingId && (!parsed.metadata || !parsed.version)) {
        throw new Error(
          "Existing templates require metadata and version objects.",
        );
      }
      const version = parsed.version;
      if (!version || typeof version !== "object") {
        throw new Error("The template definition requires a version object.");
      }
      if (previewAssetId && !previewFile) {
        if (editingId) parsed.metadata.previewAssetId = previewAssetId;
        else parsed.previewAssetId = previewAssetId;
      }
      if (previewFile) {
        setNotice("Uploading and confirming the template preview…");
        validateImageFile(previewFile);
        try {
          const assetId = await uploadAdminImage(
            previewFile,
            "template_preview",
          );
          setPreviewAssetId(assetId);
          setPreviewFile(null);
          if (editingId) parsed.metadata.previewAssetId = assetId;
          else parsed.previewAssetId = assetId;
        } catch (uploadError) {
          throw new Error(
            `Could not upload the preview image: ${uploadError instanceof Error ? uploadError.message : "image upload failed."}`,
          );
        }
      }

      setNotice("Saving the template…");
      if (editingId) {
        await apiRequest(`admin/templates/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(parsed.metadata),
        });
        metadataSaved = true;
        await apiRequest(`admin/templates/${editingId}/versions`, {
          method: "POST",
          body: JSON.stringify(parsed.version),
        });
        setNotice("Template metadata and a new immutable version were saved.");
      } else {
        await apiRequest("admin/templates", {
          method: "POST",
          body: JSON.stringify(parsed),
        });
        setNotice(
          "Template created as hidden. Review it, then publish it when ready.",
        );
      }
      resetEditor();
      await templates.refetch();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Template could not be saved.";
      setError(
        metadataSaved
          ? `Template details were saved, but the version update could not be confirmed. ${message}`
          : message,
      );
      if (metadataSaved) await templates.refetch();
      setNotice("");
    } finally {
      setBusy(false);
    }
  }

  async function setVisibility(template: TemplateRecord) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`admin/templates/${template._id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ visible: !template.visible }),
      });
      setNotice(
        `${template.name} is now ${template.visible ? "hidden" : "published"}.`,
      );
      await templates.refetch();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Visibility could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function archive(template: TemplateRecord) {
    if (
      !window.confirm(
        `Archive “${template.name}”? Existing design snapshots remain unchanged.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`admin/templates/${template._id}`, { method: "DELETE" });
      setNotice(`${template.name} was archived.`);
      await templates.refetch();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Template could not be archived.",
      );
    } finally {
      setBusy(false);
    }
  }

  function updateDraft<K extends keyof TemplateDraft>(
    key: K,
    value: TemplateDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setPreview(file: File | undefined) {
    if (!file) return;
    try {
      validateImageFile(file);
      setPreviewFile(file);
      setPreviewAssetId("");
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    } catch (fileError) {
      setError(
        fileError instanceof Error ? fileError.message : "Image is invalid.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            Author the prompts behind customer designs
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            Templates
          </h1>
        </div>
        <Button
          onClick={startCreate}
          disabled={busy}
          className="h-10 gap-2 self-start rounded-xl px-4 text-sm"
        >
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={1.8}
            data-icon="inline-start"
          />
          New template
        </Button>
      </header>
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-[#e8eee7] px-4 py-3 text-sm text-[#456b50]"
        >
          {notice}
        </p>
      ) : null}
      {error || templates.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]"
        >
          {error || templates.error}
        </p>
      ) : null}

      {editorOpen ? (
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          <CardHeader className="px-5 pt-5 pb-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {editingId ? "Edit template" : "Create template"}
                </CardTitle>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {editingId
                    ? "Saving creates a new immutable version; existing design snapshots stay unchanged."
                    : "Build a template with the form or paste a complete JSON definition. The slug is generated from its name."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editorMode === "form" ? "default" : "outline"}
                  onClick={() => switchEditorMode("form")}
                  className="h-9 rounded-xl px-3 text-xs"
                >
                  Form editor
                </Button>
                <Button
                  type="button"
                  variant={editorMode === "json" ? "default" : "outline"}
                  onClick={() => switchEditorMode("json")}
                  className="h-9 rounded-xl px-3 text-xs"
                >
                  Paste JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 border-t border-border/60 px-5 pt-5 pb-5 sm:px-6">
            {editorMode === "form" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Template name
                    <Input
                      value={draft.name}
                      onChange={(event) =>
                        updateDraft("name", event.target.value)
                      }
                      placeholder="The Convocation Cover"
                      maxLength={120}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Category
                    <Input
                      value={draft.category}
                      onChange={(event) =>
                        updateDraft("category", event.target.value)
                      }
                      placeholder="Invitation"
                      maxLength={80}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Tag (optional)
                    <Input
                      value={draft.tag}
                      onChange={(event) =>
                        updateDraft("tag", event.target.value)
                      }
                      placeholder="Popular"
                      maxLength={40}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Price (NGN)
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.priceNaira}
                      onChange={(event) =>
                        updateDraft("priceNaira", event.target.value)
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium sm:col-span-2">
                    Customer-facing description
                    <Textarea
                      value={draft.description}
                      onChange={(event) =>
                        updateDraft("description", event.target.value)
                      }
                      placeholder="Describe what the customer will receive."
                      maxLength={1000}
                      className="min-h-20"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
                  <input
                    checked={draft.institutionEnabled}
                    className="mt-0.5 size-4 accent-[#274d45]"
                    onChange={(event) =>
                      updateDraft("institutionEnabled", event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Ask customers to choose an institution
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      Customers see the institution list with its default
                      selected. Add clear logo instructions to this template’s
                      prompt.
                    </span>
                  </span>
                </label>

                <section className="rounded-xl border border-border/70 p-4">
                  <h3 className="text-sm font-semibold">Preview image</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload a JPG, PNG, or WebP image up to 10 MB. It appears as
                    the template preview and is automatically sent to the AI as
                    the layout reference.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Template preview"
                        className="h-28 w-24 rounded-lg object-cover ring-1 ring-border"
                      />
                    ) : null}
                    <label className="flex flex-col gap-2 text-xs font-medium">
                      {previewFile ? previewFile.name : "Choose image"}
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          setPreview(event.target.files?.[0])
                        }
                        className="max-w-sm"
                      />
                    </label>
                  </div>
                </section>

                <section className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Customer input fields
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prompt tokens must match exactly, for example [DISPLAY
                        WORD] or {"{{name}}"}.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        updateDraft("fields", [
                          ...draft.fields,
                          {
                            ...blankField,
                            key: `field${draft.fields.length + 1}`,
                            promptToken: `{{field${draft.fields.length + 1}}}`,
                            label: "New field",
                          },
                        ])
                      }
                      className="h-8 rounded-lg px-3 text-xs"
                    >
                      Add field
                    </Button>
                  </div>
                  {draft.fields.map((field, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-2"
                    >
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Input key
                        <Input
                          value={field.key}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, key: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="displayWord"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Prompt token
                        <Input
                          value={field.promptToken}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, promptToken: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="[DISPLAY WORD]"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Customer label
                        <Input
                          value={field.label}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Display word"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Placeholder
                        <Input
                          value={field.placeholder}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, placeholder: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Type the name to display"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Default value
                        <Input
                          value={field.defaultValue ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      defaultValue:
                                        event.target.value || undefined,
                                    }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Prefill this field for customers"
                        />
                        <span className="font-normal text-muted-foreground">
                          Optional. Customers can change this when they start a
                          design.
                        </span>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Input type
                        <select
                          value={field.type}
                          onChange={(event) =>
                            updateDraft(
                              "fields",
                              draft.fields.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      type: event.target
                                        .value as TemplateField["type"],
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-xl border border-input bg-background px-3"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Long text</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                        </select>
                      </label>
                      <div className="flex items-end justify-between gap-3">
                        <label className="flex items-center gap-2 pb-3 text-xs">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) =>
                              updateDraft(
                                "fields",
                                draft.fields.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        required: event.target.checked,
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          Required
                        </label>
                        {draft.fields.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              updateDraft(
                                "fields",
                                draft.fields.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                            className="h-8 text-xs text-destructive"
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </section>

                <section className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Customer photo inputs
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        These are the only images customers upload. The template
                        preview is automatically sent to the AI as its layout
                        reference.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        updateDraft("imageInputs", [
                          ...draft.imageInputs,
                          {
                            ...blankImageInput,
                            key: `image${draft.imageInputs.length + 1}`,
                            label: "Your photo",
                            required: true,
                            assetId: null,
                          },
                        ])
                      }
                      className="h-8 rounded-lg px-3 text-xs"
                    >
                      Add photo slot
                    </Button>
                  </div>
                  {draft.imageInputs.map((imageInput, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-2"
                    >
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Input key
                        <Input
                          value={imageInput.key}
                          onChange={(event) =>
                            updateDraft(
                              "imageInputs",
                              draft.imageInputs.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, key: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="subject"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Customer-facing label
                        <Input
                          value={imageInput.label}
                          onChange={(event) =>
                            updateDraft(
                              "imageInputs",
                              draft.imageInputs.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Your photo"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-medium">
                        Maximum customer photos
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={imageInput.quantity}
                          onChange={(event) =>
                            updateDraft(
                              "imageInputs",
                              draft.imageInputs.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      quantity: Number(event.target.value),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>
                      <div className="flex items-end justify-between gap-3">
                        <label className="flex items-center gap-2 pb-3 text-xs">
                          <input
                            type="checkbox"
                            checked={imageInput.required}
                            onChange={(event) =>
                              updateDraft(
                                "imageInputs",
                                draft.imageInputs.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        required: event.target.checked,
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          Required
                        </label>
                        {draft.imageInputs.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              updateDraft(
                                "imageInputs",
                                draft.imageInputs.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                            className="h-8 text-xs text-destructive"
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </section>

                <label className="flex flex-col gap-2 text-xs font-medium">
                  Base prompt
                  <Textarea
                    value={draft.promptTemplate}
                    onChange={(event) =>
                      updateDraft("promptTemplate", event.target.value)
                    }
                    spellCheck={false}
                    className="min-h-64 resize-y rounded-xl bg-[#192320] p-4 font-mono text-xs leading-relaxed text-[#e3e9e2]"
                    placeholder="Write the admin-authored base prompt. Insert each field's prompt token exactly where its value should appear."
                  />
                </label>
                <section className="grid gap-4 rounded-xl border border-border/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Image model
                    <select
                      value={draft.model}
                      disabled
                      className="h-10 rounded-xl border border-input bg-background px-3 disabled:opacity-70"
                    >
                      <option value="gpt-image-2">GPT Image 2</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Image dimensions
                    <select
                      value={draft.size}
                      onChange={(event) =>
                        updateDraft(
                          "size",
                          event.target.value as TemplateDraft["size"],
                        )
                      }
                      className="h-10 rounded-xl border border-input bg-background px-3"
                    >
                      <option value="auto">Automatic</option>
                      <option value="1024x1024">Square</option>
                      <option value="1024x1536">Portrait</option>
                      <option value="1536x1024">Landscape</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Quality
                    <select
                      value={draft.quality}
                      onChange={(event) =>
                        updateDraft(
                          "quality",
                          event.target.value as TemplateDraft["quality"],
                        )
                      }
                      className="h-10 rounded-xl border border-input bg-background px-3"
                    >
                      <option value="auto">Automatic</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium">
                    Output format
                    <select
                      value={draft.outputFormat}
                      onChange={(event) =>
                        updateDraft(
                          "outputFormat",
                          event.target.value as TemplateDraft["outputFormat"],
                        )
                      }
                      className="h-10 rounded-xl border border-input bg-background px-3"
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </label>
                </section>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Paste a template definition. The slug is optional and ignored;
                  it is generated from the template name. Define only customer
                  photo slots (`role: "subject"`) in `version.imageInputs`; the
                  uploaded preview is automatically sent to the AI as the layout
                  reference.
                </p>
                <Textarea
                  value={jsonValue}
                  onChange={(event) => setJsonValue(event.target.value)}
                  spellCheck={false}
                  className="min-h-[460px] resize-y rounded-xl bg-[#192320] p-4 font-mono text-xs leading-relaxed text-[#e3e9e2]"
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  For edits provide{" "}
                  <code>{'{ "metadata": { … }, "version": { … } }'}</code>.
                  Saving appends an immutable version.
                </p>
                <label className="flex flex-col gap-2 text-xs font-medium">
                  Template preview image (optional)
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setPreview(event.target.files?.[0])}
                  />
                </label>
              </>
            )}
            <div className="flex flex-wrap justify-between gap-3 border-t border-border/60 pt-4">
              <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                The prompt, inputs, model settings, and price are snapshotted
                for each paid generation.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={resetEditor}
                  className="h-9 rounded-xl px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveDefinition()}
                  className="h-9 rounded-xl px-4 text-xs"
                >
                  {busy
                    ? "Saving…"
                    : editingId
                      ? "Save new version"
                      : "Create hidden template"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold">Template library</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {templates.data.templates.length} templates ·{" "}
            {
              templates.data.templates.filter((template) => template.visible)
                .length
            }{" "}
            published
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {templates.data.templates.map((template) => {
            const version = template.versions.find(
              (item) => item.version === template.currentVersion,
            );
            return (
              <Card
                key={template._id}
                className="gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-none ring-1 ring-border/80"
              >
                <div className="relative grid h-40 place-items-center bg-[#e9e6df] text-[#a5a199]">
                  {template.preview?.url ? (
                    <img
                      src={template.preview.url}
                      alt={`${template.name} preview`}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Image01Icon}
                      strokeWidth={1.4}
                      className="size-9"
                    />
                  )}
                  <Badge
                    variant="secondary"
                    className={`absolute top-3 left-3 rounded-full bg-white/90 text-[10px] backdrop-blur-sm ${template.visible ? "text-[#50725c]" : "text-muted-foreground"}`}
                  >
                    {template.visible ? "Published" : "Hidden"}
                  </Badge>
                </div>
                <CardHeader className="flex-row items-start justify-between gap-3 px-4 pt-4 pb-1">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm font-semibold">
                      {template.name}
                    </CardTitle>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {template.category} · v{template.currentVersion} ·{" "}
                      {version?.fields.length ?? 0} fields
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {version
                      ? new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: version.currency,
                          maximumFractionDigits: 0,
                        }).format(version.priceMinor / 100)
                      : "—"}
                  </p>
                </CardHeader>
                <CardContent className="px-4 pt-3 pb-4">
                  <p className="line-clamp-2 min-h-8 text-[11px] text-muted-foreground">
                    {template.description}
                  </p>
                  <p className="mt-2 line-clamp-2 rounded-lg bg-[#f7f5f3] p-2 font-mono text-[9px] text-muted-foreground">
                    {version?.promptTemplate ?? "Missing prompt"}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <span className="text-[10px] text-muted-foreground">
                      {version?.imageInputs.length ?? 0} image slots ·{" "}
                      {template.slug}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        aria-label={`Edit ${template.name}`}
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => startEdit(template)}
                        className="rounded-lg"
                      >
                        <HugeiconsIcon icon={Edit01Icon} strokeWidth={1.8} />
                      </Button>
                      <Button
                        aria-label={
                          template.visible
                            ? `Hide ${template.name}`
                            : `Publish ${template.name}`
                        }
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => void setVisibility(template)}
                        className="rounded-lg"
                      >
                        <HugeiconsIcon
                          icon={template.visible ? ViewOffIcon : ViewIcon}
                          strokeWidth={1.8}
                        />
                      </Button>
                      <Button
                        aria-label={`Archive ${template.name}`}
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => void archive(template)}
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {!templates.isLoading && !templates.data.templates.length ? (
          <p className="rounded-2xl bg-white px-5 py-12 text-center text-sm text-muted-foreground ring-1 ring-border/80">
            No templates are in the library yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
