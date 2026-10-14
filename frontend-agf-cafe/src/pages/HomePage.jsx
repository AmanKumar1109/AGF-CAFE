import { HeroSection } from '../features/hero';
import { PopularMenu } from '../features/menu';
import { CraveDeliveryBanner } from '../features/promotional';
import { TrustBadges, CustomerReviews } from '../features/reviews-trust';

export const HomePage = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <PopularMenu />
      <CraveDeliveryBanner />
      <TrustBadges />
      <CustomerReviews />
    </div>
  );
};
