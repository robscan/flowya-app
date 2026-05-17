/**
 * Canonical English privacy policy for FLOWYA iOS V1.
 * Keep this separate from the web privacy policy at /privacy.
 */

export type PrivacyPolicyIosSection = { title: string; paragraphs: string[] };

/** Last updated date shown in the public iOS policy. */
export const PRIVACY_POLICY_IOS_LAST_UPDATED_EN = 'May 17, 2026';

export const PRIVACY_POLICY_IOS_SECTIONS_EN: PrivacyPolicyIosSection[] = [
  {
    title: '1. Who we are',
    paragraphs: [
      'FLOWYA is a personal travel and places app for discovering, organizing, and remembering places. This policy applies to FLOWYA iOS V1, the native iOS app used with Apple MapKit.',
      'The general FLOWYA web privacy policy remains available separately at /privacy. This iOS policy is specific to the local-first native iOS experience.',
    ],
  },
  {
    title: '2. Local-first iOS V1',
    paragraphs: [
      'FLOWYA iOS V1 is designed to work local-first. The app may store your flows, stops, Passport session, tags, collections, local places, recent searches, preferences, and similar app data on your device.',
      'FLOWYA iOS V1 does not require a login to use the core local-first experience and does not actively mutate your iOS V1 personal app data in a remote Supabase account as part of normal local use.',
    ],
  },
  {
    title: '3. Location',
    paragraphs: [
      'FLOWYA iOS V1 may ask for When In Use location permission. Location is used to show where you are on the map, center the map, estimate nearby places, and help you explore places around you while you are using the app.',
      'FLOWYA does not use your location for advertising, cross-app tracking, or selling data. You can change location permissions at any time in iOS Settings.',
    ],
  },
  {
    title: '4. Maps',
    paragraphs: [
      'FLOWYA iOS V1 uses Apple MapKit as its native map runtime. Apple may process map requests as needed to provide maps, search, routing, or related platform services under Apple terms and privacy practices.',
      'FLOWYA iOS V1 does not use Mapbox as its iOS map runtime.',
    ],
  },
  {
    title: '5. Photos and profile media',
    paragraphs: [
      'If you choose to add photos, profile media, or other private media in FLOWYA iOS V1, those items are treated as part of your local app data unless a feature clearly tells you it will upload or share them.',
      'FLOWYA iOS V1 does not promise public photo publishing or social sharing as an active V1 feature.',
    ],
  },
  {
    title: '6. Local deletion',
    paragraphs: [
      'The Account area includes Erase All Local Data. Using it removes local FLOWYA app data from the device, such as local places, flows, stops, Passport state, tags, collections, recent searches, preferences, and other local app state controlled by FLOWYA.',
      'Deleting the app may also remove local app data according to iOS behavior. Data managed by Apple, such as system-level map or permission records, is controlled through iOS and Apple services.',
    ],
  },
  {
    title: '7. Remote services and support',
    paragraphs: [
      'FLOWYA may use remote services for support, feedback, app delivery, crash diagnostics, or future account-based features. When a feature sends data away from the device, the app should make that behavior clear in context.',
      'For iOS V1 local-first use, FLOWYA does not require a remote account profile to use the core app.',
    ],
  },
  {
    title: '8. Tracking, ads, sales, and cookies',
    paragraphs: [
      'FLOWYA iOS V1 does not sell your personal data, does not show behavioral advertising, and does not track you across other companies apps and websites for advertising purposes.',
      'FLOWYA iOS V1 does not use advertising cookies. Native iOS app storage may be used for app preferences, session state, cache, and local app functionality.',
    ],
  },
  {
    title: '9. Retention and security',
    paragraphs: [
      'Local app data remains on your device until you delete it, use Erase All Local Data, or remove the app, subject to iOS backup and device settings that you control.',
      'We use reasonable technical and organizational safeguards for FLOWYA systems. No app or network service can guarantee absolute security.',
    ],
  },
  {
    title: '10. Changes',
    paragraphs: [
      'We may update this policy when FLOWYA iOS features, data practices, providers, or legal requirements change. The latest update date appears at the top of this page.',
    ],
  },
  {
    title: '11. Contact',
    paragraphs: [
      'For privacy questions, use the support or feedback options available in FLOWYA. If new account or remote data features are introduced, this policy will be updated before those practices are described as active.',
    ],
  },
];
