import { ImageResponse } from 'next/og'

// Configuration de la route
export const runtime = 'edge'

// Taille standard recommandée pour un favicon polyvalent
export const size = {
  width: 48,
  height: 48,
}
export const contentType = 'image/png'

// Génération de l'image
export default function Icon() {
  return new ImageResponse(
    (
      // Conteneur principal (le carré arrondi)
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Fond dégradé style "anime dark"
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
          borderRadius: '25%', // Arrondi moderne
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Conteneur du texte pour l'effet d'ombre portée */}
        <div
          style={{
            display: 'flex',
            fontSize: 28, // Taille ajustée pour 48x48
            fontWeight: 900, // Très gras
            fontStyle: 'italic', // Dynamique
            fontFamily: 'sans-serif',
            // Ombre portée solide style "manga"
            textShadow: '2px 2px 0px #000',
          }}
        >
          {/* Les lettres aux couleurs de la France */}
          <span style={{ color: '#3b82f6' }}>M</span> {/* Bleu */}
          <span style={{ color: '#ffffff' }}>F</span> {/* Blanc */}
          <span style={{ color: '#ef4444' }}>L</span> {/* Rouge */}
        </div>
      </div>
    ),
    // Options ImageResponse
    {
      ...size,
    }
  )
}