import { Suspense } from 'react';
import MobileController from '@/features/controller/components/MobileController';

export default function ControllerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileController />
    </Suspense>
  );
}