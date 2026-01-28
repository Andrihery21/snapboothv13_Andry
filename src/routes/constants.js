// Définition des UUIDs constants pour les écrans de capture
export const SCREEN_UUIDS = {
  HORIZONTAL_1: '1f8f7e9a-5d3b-4c1a-8c4e-6f2d3b1a5c4e', // Écran Univers
  VERTICAL_1: '2a9e8f7b-6c4d-5e2f-9d3a-7b5c4d3e2f1a',   // Écran Cartoon/Glow Up
  VERTICAL_2: '3b0f9e8c-7d5e-6f3e-0e4b-8c6d5e4f3e2b',   // Écran Dessin/Noir & Blanc
  VERTICAL_3: '4c1a0f9d-8e6f-7e4e-1f5c-9d7e6f5e4e3c',   // Écran Caricatures/Normal
  PROPS: '5c2b1a0e-9f7e-8f5e-2g6d-0f8e9g7h6g5h',        // Écran Props
  VIDEO: '6d3c2b1f-0g8f-9g6e-3h7e-1g9f0h8i7i6j',         // Écran Vidéo
  // Nouveaux écrans BG
  HORIZONTAL_BG1: '7e4d3c2b-1h9g-0h7g-4i8f-2h0g1i8j7j8k', // Écran Horizontal BG1
  VERTICAL_BG1: '8f5e4d3c-2i0h-1h8g-5j9g-3i1h2j9k8k9l',   // Écran Vertical BG1
  VERTICAL_BG2: '9g6f5e4d-3j1i-2i9h-6k0h-4j2i3k0l0l1m',   // Écran Vertical BG2
  VERTICAL_BG3: '0h7g6f5e-4k2j-3j0i-7l1i-5k3j4l1m1m2n',   // Écran Vertical BG3
};

// Routes d'accès aux écrans de capture
export const CAPTURE_ROUTES = {
  HORIZONTAL_1: `/captures/screen/${SCREEN_UUIDS.HORIZONTAL_1}`,
  VERTICAL_1: `/captures/screen/${SCREEN_UUIDS.VERTICAL_1}`,
  VERTICAL_2: `/captures/screen/${SCREEN_UUIDS.VERTICAL_2}`,
  VERTICAL_3: `/captures/screen/${SCREEN_UUIDS.VERTICAL_3}`,
  PROPS: `/captures/screen/${SCREEN_UUIDS.PROPS}`,
  VIDEO: `/captures/screen/${SCREEN_UUIDS.VIDEO}`,
  // Nouvelles routes BG
  HORIZONTAL_BG1: `/captures/screen/${SCREEN_UUIDS.HORIZONTAL_BG1}`,
  VERTICAL_BG1: `/captures/screen/${SCREEN_UUIDS.VERTICAL_BG1}`,
  VERTICAL_BG2: `/captures/screen/${SCREEN_UUIDS.VERTICAL_BG2}`,
  VERTICAL_BG3: `/captures/screen/${SCREEN_UUIDS.VERTICAL_BG3}`,
};

// Autres routes importantes
export const ROUTES = {
  PHOTO_GRID: '/photos/grid',
  ADMIN_DASHBOARD: '/admin/dashboard',
  EVENT_PHOTOS: '/event/:eventId/photos',
}; 