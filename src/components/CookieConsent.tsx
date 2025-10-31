import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({ analytics: true, marketing: false }));
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({ analytics: false, marketing: false }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 shadow-lg">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-foreground/80">
          <p>
            <strong>We use cookies</strong> to ensure essential functionality and improve your experience. 
            Analytics cookies are optional. See our <a href="/cookies" className="text-cyan-400 hover:underline">Cookie Policy</a> and <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReject}>
            Reject Optional
          </Button>
          <Button size="sm" onClick={handleAccept} className="bg-cyan-500 hover:bg-cyan-400 text-black">
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
