import React, { useEffect, useMemo, useState } from "react";
import RailsTableNew from "../components/RailsTableNew";
import { fetchRails } from "../lib/api";
import type { Rail } from "../types/rails";

export default function Index() {
  const [rails, setRails] = useState<Rail[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string>();

  const canSimulate = useMemo(() => true, []);

  async function runSimulation() {
    setLoading(true);
    setLastError(undefined);
    try {
      const data = await fetchRails();
      setRails(data);
    } catch (e: any) {
      setLastError(e?.message || "Échec simulation.");
    } finally {
      setLoading(false);
    }
  }

  async function testEmail() {
    setLoading(true);
    setLastError(undefined);
    try {
      console.log('🚀 [TEST-EMAIL] Calling edge function...');
      console.log('📍 [TEST-EMAIL] URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );
      
      const data = await response.json();
      console.log('📧 [TEST-EMAIL] Response:', data);
      
      if (response.ok) {
        setLastError(undefined);
        alert('✅ Email test envoyé! Vérifie ybolduc@ipayx.ai (inbox + spam)');
      } else {
        console.error('❌ [TEST-EMAIL] Error response:', data);
        setLastError(`Erreur email: ${data.error}`);
      }
    } catch (e: any) {
      console.error('❌ [TEST-EMAIL] Exception:', e);
      setLastError(`Erreur test-email: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Option: auto-load rails on mount
    // runSimulation().catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Demo Mode Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-200 text-sm flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <strong>Demo Mode:</strong> Simulation data for testing and demonstration purposes only.
          </p>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold">
          iPAYX V4 — Meta-Router (Lovable demo)
        </h1>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runSimulation}
            disabled={!canSimulate || loading}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-medium disabled:opacity-60"
          >
            {loading ? "Simulation…" : "Run Simulation"}
          </button>
          <button
            onClick={testEmail}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-medium disabled:opacity-60"
          >
            🧪 Test Email
          </button>
          {lastError && (
            <div className="text-sm rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-200">
              {lastError}
            </div>
          )}
        </div>

        <RailsTableNew rails={rails} />

        <div className="text-xs opacity-70">
          Données chargées via Edge Function: <code>/proxy-github/meta-router</code>.
          Configure les variables d'environnement Supabase IPAYX_* si nécessaire.
        </div>
      </div>
    </main>
  );
}
