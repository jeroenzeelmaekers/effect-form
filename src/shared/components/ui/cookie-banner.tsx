import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';

import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';

export default function CookieBanner() {
  const posthog = usePostHog();
  const [consentGiven, setConsentGiven] = useState(() =>
    posthog.get_explicit_consent_status(),
  );

  function handleAcceptCookies() {
    posthog.opt_in_capturing();
    setConsentGiven('granted');
  }

  function handleDeclineCookies() {
    posthog.opt_out_capturing();
    setConsentGiven('denied');
  }

  if (consentGiven !== 'pending') return null;

  return (
    <Card className="absolute bottom-0 left-0 m-2 md:w-1/2 lg:w-1/3">
      <CardHeader>
        <CardTitle>Can we store some cookies?</CardTitle>
      </CardHeader>
      <CardContent>
        We use tracking cookies to understand how you use the product and help
        us improve it. Please accept cookies to help us improve.
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button variant="outline" onClick={handleDeclineCookies}>
          Decline
        </Button>
        <Button variant="default" onClick={handleAcceptCookies}>
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
