import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-center">
      <h1 className="text-2xl font-semibold text-text">Page not found</h1>
      <p className="text-text-secondary">The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-brand hover:text-brand-hover">
        Back to CollegeBook
      </Link>
    </div>
  );
}
