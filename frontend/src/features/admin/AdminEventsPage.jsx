import { useState } from "react";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { useAdminEvents, useEventActions } from "../../hooks/useEvents";

const EMPTY_EVENT_FORM = {
  title: "",
  description: "",
  eventDate: "",
  endDate: "",
  location: "",
  category: "GENERAL",
  isPublished: true,
};

function EventForm({ form, setForm, actions, onSubmit }) {
  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <TextField
        label="Event title"
        value={form.title}
        onChange={updateField("title")}
        required
      />

      <TextField
        label="Date and time"
        type="datetime-local"
        value={form.eventDate}
        onChange={updateField("eventDate")}
        required
      />

      <TextField
        label="End date and time (optional)"
        type="datetime-local"
        value={form.endDate}
        onChange={updateField("endDate")}
      />

      <TextField
        label="Location"
        value={form.location}
        onChange={updateField("location")}
        placeholder="Main auditorium"
      />

      <TextField
        label="Category"
        value={form.category}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            category: event.target.value.toUpperCase(),
          }))
        }
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-text">
          Description
        </span>
        <textarea
          rows={4}
          value={form.description}
          onChange={updateField("description")}
          className="w-full rounded-md border border-border bg-surface p-2 text-text"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              isPublished: event.target.checked,
            }))
          }
          className="accent-brand"
        />
        Publish immediately
      </label>

      {actions.create.isError && (
        <p className="text-sm text-danger">{actions.create.error.message}</p>
      )}

      <Button type="submit" disabled={actions.create.isPending}>
        {actions.create.isPending ? "Saving…" : "Create event"}
      </Button>
    </form>
  );
}

function ScheduledEvents({ events, actions }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-text">Scheduled events</h2>

      <div className="space-y-2">
        {events?.map((event) => (
          <div
            key={event.id}
            className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-text">{event.title}</p>
              <p className="text-xs text-text-secondary">
                {new Date(event.eventDate).toLocaleString()} · {event.category} ·{" "}
                {event.isPublished ? "Published" : "Draft"}
              </p>
            </div>

            <Button
              variant="ghost"
              className="text-danger"
              onClick={() => actions.remove.mutate(event.id)}
              disabled={actions.remove.isPending}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminEventsPage() {
  const query = useAdminEvents();
  const actions = useEventActions();
  const [form, setForm] = useState(EMPTY_EVENT_FORM);

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.title || !form.eventDate) {
      return;
    }

    actions.create.mutate(
      {
        ...form,
        eventDate: new Date(form.eventDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      },
      {
        onSuccess: () => setForm(EMPTY_EVENT_FORM),
      },
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold text-text">
          Institutional Events
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create memorable days, ceremonies and important institutional dates.
        </p>
      </header>

      <EventForm
        form={form}
        setForm={setForm}
        actions={actions}
        onSubmit={handleSubmit}
      />

      <ScheduledEvents events={query.data} actions={actions} />
    </div>
  );
}
