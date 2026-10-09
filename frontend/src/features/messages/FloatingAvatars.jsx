import { useNavigate } from 'react-router-dom';

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`;
}

const ANIMATIONS = ['animate-float-a', 'animate-float-b', 'animate-float-c'];

/**
 * FloatingAvatars — purely ambient (but still clickable), filling the
 * otherwise-empty margins on wide screens since MainLayout's <main> caps
 * out at max-w-2xl. Only ever shows people the viewer is ACTUALLY
 * chatting with — pulled from their real conversation list, not random
 * students — so this never becomes a second, uncontrolled channel for
 * discovering people (that's Network's job, with its own visibility
 * rules already enforced server-side; this just reuses data the viewer
 * can already see).
 *
 * Hidden below the xl breakpoint — on anything narrower there usually
 * isn't real blank space to fill, and floating avatars over real content
 * would be a distraction rather than decoration.
 */
export function FloatingAvatars({ conversations, side }) {
  if (!conversations?.length) return null;

  // Left side gets even-indexed conversations, right gets odd — simple
  // deterministic split so the two sides don't visually mirror each other.
  const people = conversations
    .map((c) => c.participants?.[0])
    .filter(Boolean)
    .filter((_, i) => (side === 'left' ? i % 2 === 0 : i % 2 === 1))
    .slice(0, 4);

  if (people.length === 0) return null;

  const positionClass = side === 'left' ? 'left-4 xl:left-10' : 'right-4 xl:right-10';

  return (
    <div className={`pointer-events-none fixed top-32 hidden xl:flex flex-col gap-8 ${positionClass}`}>
      {people.map((student, i) => (
        <AvatarBubble key={student.id} student={student} animation={ANIMATIONS[i % ANIMATIONS.length]} />
      ))}
    </div>
  );
}

function AvatarBubble({ student, animation }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/messages?with=${student.id}`)}
      title={`${student.firstName} ${student.lastName}`}
      className={`pointer-events-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-brand-soft text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-110 ${animation}`}
    >
      {student.profilePhotoUrl ? (
        <img src={student.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(student.firstName, student.lastName)
      )}
    </button>
  );
}
