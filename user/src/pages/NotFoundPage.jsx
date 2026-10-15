import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center bg-[#faf7f2] text-stone-900 px-4 py-20">
      <div className="text-center space-y-4 max-w-md">
        <span className="text-6xl font-black text-amber-500">404</span>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-stone-600 text-sm">
          Oops! The page or delicious recipe you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button size="md">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
