import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { ImageDropzone } from "../../components/ImageDropzone";
import {
  useProfile,
  useStudentProfile,
  useUpdateProfile,
} from "../../hooks/useProfile";
import { usePrivacySettings, useUpdatePrivacy } from "../../hooks/usePrivacy";
import { useConnectionActions } from "../../hooks/useConnections";
import { LoadingState } from '../../components/loading/Spinner';

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`;
}

function ProfileHeader({ student, actions }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(20,40,45,0.05)]">
      <div className="relative h-36 bg-brand-soft sm:h-48">
        {student.coverPhotoUrl && (
          <img
            src={student.coverPhotoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        {student.institution?.logoUrl && (
          <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white p-1.5 shadow-lg sm:right-6 sm:top-6 sm:h-16 sm:w-16">
            <img
              src={student.institution.logoUrl}
              alt={`${student.institution.name} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="relative z-100 -mt-10 flex items-end justify-between gap-3 sm:-mt-12">
          <div className="relative z-110 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-brand-soft text-xl font-semibold text-brand shadow-lg sm:h-24 sm:w-24">
            {student.profilePhotoUrl ? (
              <img
                src={student.profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(student.firstName, student.lastName)
            )}
          </div>
          {actions}
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
            {student.firstName} {student.lastName}
          </h1>
          {student.user?.username && <p className="mt-0.5 text-sm font-medium text-brand">@{student.user.username}</p>}
          <p className="mt-1 text-sm text-text-secondary">
            {student.department?.name ?? student.faculty?.name}
            {student.academicSet?.name ? ` · ${student.academicSet.name}` : ""}
          </p>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
            {student.institution?.logoUrl && (
              <img
                src={student.institution.logoUrl}
                alt=""
                className="h-4 w-4 object-contain"
              />
            )}
            <span className="truncate">{student.institution?.name}</span>
          </div>
          {student.bio && (
            <p className="mt-3 text-sm leading-6 text-text sm:text-base">
              {student.bio}
            </p>
          )}
          {student.location && (
            <p className="mt-1 text-sm text-text-secondary">
              📍 {student.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function profileErrorMessage(error) {
  const fieldErrors = error?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldMessage = Object.values(fieldErrors)
      .flat()
      .find(Boolean);
    if (firstFieldMessage) return firstFieldMessage;
  }

  const formError = error?.details?.formErrors?.find(Boolean);
  return formError || error?.message || "Unable to save profile";
}

function EditProfileForm({ student, onDone }) {
  const [form, setForm] = useState({
    username: student.user?.username ?? "",
    bio: student.bio ?? "",
    location: student.location ?? "",
    gender: student.gender ?? "",
    phoneNumber: student.phoneNumber ?? "",
    dateOfBirth: student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
      : "",
    profilePhotoUrl: student.profilePhotoUrl ?? "",
    coverPhotoUrl: student.coverPhotoUrl ?? "",
  });
  const updateProfile = useUpdateProfile();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Only send fields with a value — backend fields are all optional,
    // and an empty string for a url field would fail validation.
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ""),
    );
    // Keep dateOfBirth as YYYY-MM-DD. That is the browser date-input format
    // and the backend validator now uses the same API contract. The backend
    // service converts it to a Date before writing through Prisma.
    updateProfile.mutate(payload, { onSuccess: onDone });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-surface p-4"
    >
      <div className="rounded-xl border border-border bg-bg/60 p-3">
        <TextField
          label="Your @mention username"
          name="username"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30) }))}
          placeholder="e.g. sogapeters"
        />
        <p className="mt-1.5 text-xs text-text-secondary">3–30 letters, numbers or underscores. This becomes your unique @mention.</p>
      </div>

      <TextField
        label="Bio"
        name="bio"
        value={form.bio}
        onChange={handleChange}
        placeholder="A short line about yourself"
      />
      <TextField
        label="Location"
        name="location"
        value={form.location}
        onChange={handleChange}
      />
      <TextField
        label="Gender"
        name="gender"
        value={form.gender}
        onChange={handleChange}
      />
      <TextField
        label="Phone number"
        name="phoneNumber"
        type="tel"
        value={form.phoneNumber}
        onChange={handleChange}
      />
      <TextField
        label="Date of birth"
        name="dateOfBirth"
        type="date"
        value={form.dateOfBirth}
        onChange={handleChange}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">
            Profile photo
          </span>
          <ImageDropzone
            purpose="profile"
            shape="circle"
            currentUrl={form.profilePhotoUrl}
            onUploaded={(url) =>
              setForm((f) => ({ ...f, profilePhotoUrl: url }))
            }
            className="h-24 w-24"
          />
        </div>
        <div className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-text">
            Cover photo
          </span>
          <ImageDropzone
            purpose="cover"
            currentUrl={form.coverPhotoUrl}
            onUploaded={(url) => setForm((f) => ({ ...f, coverPhotoUrl: url }))}
            className="h-40"
          />
        </div>
      </div>

      {updateProfile.isError && (
        <p className="text-sm text-danger">{profileErrorMessage(updateProfile.error)}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const PRIVACY_LABELS = {
  whoCanMessage: "Who can message you",
  whoCanViewProfile: "Who can view your profile",
  whoCanViewPosts: "Who can view your posts",
  showBirthday: "Show my birthday to institution members",
};

const MESSAGE_OPTIONS = [
  "NOBODY_EXCEPT_CONNECTIONS",
  "SET_ONLY",
  "INSTITUTION_ONLY",
  "APPROVED_INSTITUTIONS",
  "EVERYONE",
];
const VISIBILITY_OPTIONS = [
  "CONNECTIONS_ONLY",
  "SET_ONLY",
  "INSTITUTION_ONLY",
  "EVERYONE",
];

function readableOption(value) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function PrivacySettings() {
  const privacyQuery = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacy();

  if (privacyQuery.isLoading || !privacyQuery.data) return null;

  function handleChange(field, value) {
    updatePrivacy.mutate({ [field]: value });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text">Privacy</h2>
      {[
        ["whoCanMessage", MESSAGE_OPTIONS],
        ["whoCanViewProfile", VISIBILITY_OPTIONS],
        ["whoCanViewPosts", VISIBILITY_OPTIONS],
        ["showBirthday", null],
      ].map(([field, options]) =>
        options ? (
          <label key={field} className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              {PRIVACY_LABELS[field]}
            </span>
            <select
              value={privacyQuery.data[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {readableOption(opt)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label
            key={field}
            className="flex items-center gap-3 rounded-xl bg-bg p-3 text-sm text-text"
          >
            <input
              type="checkbox"
              checked={Boolean(privacyQuery.data[field])}
              onChange={(e) => handleChange(field, e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            <span>{PRIVACY_LABELS[field]}</span>
          </label>
        ),
      )}
    </div>
  );
}

function OwnProfile() {
  const profileQuery = useProfile();
  const [editing, setEditing] = useState(false);

  if (profileQuery.isLoading)
    return <LoadingState message="Loading profile…" />;
  if (!profileQuery.data) return null;

  return (
    <div className="space-y-4">
      <ProfileHeader student={profileQuery.data} />

      {editing ? (
        <EditProfileForm
          student={profileQuery.data}
          onDone={() => setEditing(false)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      )}

      <PrivacySettings />
    </div>
  );
}

function OtherStudentProfile({ id }) {
  const studentQuery = useStudentProfile(id);
  const { block } = useConnectionActions();

  if (studentQuery.isLoading)
    return <LoadingState message="Loading profile…" />;

  if (studentQuery.isError) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-secondary">
          {studentQuery.error.status === 403 ||
          studentQuery.error.status === 404
            ? "This profile is private or doesn't exist."
            : "Something went wrong loading this profile."}
        </p>
      </div>
    );
  }

  return (
    <ProfileHeader
      student={studentQuery.data}
      actions={
        <Button
          variant="ghost"
          className="text-danger"
          onClick={() => {
            if (
              window.confirm(
                `Block ${studentQuery.data.firstName}? They won't be able to message you, view your profile, or see your posts.`,
              )
            ) {
              block.mutate(id);
            }
          }}
          disabled={block.isPending}
        >
          {block.isSuccess ? "Blocked" : "Block"}
        </Button>
      }
    />
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: me } = useProfile();

  // /profile/:id where :id is actually the viewer's own id — just show
  // the editable own-profile view instead of the read-only other-student one.
  useEffect(() => {
    if (id && me && id === me.id) navigate("/profile", { replace: true });
  }, [id, me, navigate]);

  return id ? <OtherStudentProfile id={id} /> : <OwnProfile />;
}