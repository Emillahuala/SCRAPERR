/**
 * useAlertNotifications — suscripción Realtime a nuevos alert_matches.
 *
 * Cuando Supabase está disponible, abre un canal Realtime y muestra
 * un toast por cada match nuevo del usuario.
 *
 * En mock mode expone `simulateMatch()` para que el botón "Simular match"
 * dispare un toast sin necesidad de Supabase.
 */
import { useEffect } from 'react'
import { toast } from 'sonner'
import { getSupabaseClient, isSupabaseReady } from '@/lib/supabase'

interface MatchPayload {
  sailing_id: number
  cabin_type: string
  price_usd: number | null
  deal_score: number | null
}

function showMatchToast(match: MatchPayload) {
  toast.success('🎯 ¡Nuevo match de alerta!', {
    description: `Zarpe #${match.sailing_id} · ${match.cabin_type} · USD ${match.price_usd ?? '—'}`,
    duration: 8000,
    action: {
      label: 'Ver detalle',
      onClick: () => {
        window.location.href = `/sailing/${match.sailing_id}`
      },
    },
  })
}

/**
 * Hook: subscribe to real-time alert_matches for the authenticated user.
 * No-op in mock mode.
 */
export function useAlertNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!isSupabaseReady() || !userId) return

    const client = getSupabaseClient()
    if (!client) return

    // TODO: uncomment when Supabase is integrated
    // const channel = client
    //   .channel(`alert-matches-${userId}`)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: 'INSERT',
    //       schema: 'public',
    //       table: 'alert_matches',
    //       filter: `user_id=eq.${userId}`,
    //     },
    //     (payload) => {
    //       showMatchToast(payload.new as MatchPayload)
    //     },
    //   )
    //   .subscribe()
    //
    // return () => { void client.removeChannel(channel) }
  }, [userId])
}

/** Simulate a match notification — for demo/testing in mock mode. */
export function simulateMatch() {
  showMatchToast({
    sailing_id: 2,
    cabin_type: 'Balcón',
    price_usd: 1390,
    deal_score: 94,
  })
}
