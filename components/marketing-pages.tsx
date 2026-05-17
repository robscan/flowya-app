import { type Href, Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TypographyStyles } from '@/components/design-system/typography';
import { Colors, Elevation, Radius, Spacing, WebNoTextSelect, WebTouchManipulation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SUPPORT_EMAIL = 'support@flowya.app'; // TODO: reemplazar si Flowya define un email público distinto.
const HOME_ROUTE = '/' as Href & string;
const SUPPORT_ROUTE = '/support' as Href & string;
const PRIVACY_ROUTE = '/privacy-ios' as Href & string;
const LANDING_IMAGES = {
  appIcon: require('../docs/images/Icon-App-1024x1024.png'),
  explore: require('../docs/images/Appimages/01-explore.png'),
  searchResults: require('../docs/images/Appimages/06-search-paris-results.png'),
  flow: require('../docs/images/Appimages/02-flow-content.png'),
  passport: require('../docs/images/Appimages/03-passport-content.png'),
  landingAtmosphere: require('../docs/images/marketing/flowya-landing-hero-atmosphere.png'),
  supportAtmosphere: require('../docs/images/marketing/flowya-support-hero-atmosphere.png'),
};

type MarketingColors = typeof Colors.light;

type SeoConfig = {
  title: string;
  description: string;
};

type MarketingLink = {
  label: string;
  href: Href & string;
};

function useWebSeo({ title, description }: SeoConfig) {
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.title = title;

    const upsertMeta = (selector: string, attrs: Record<string, string>) => {
      let tag = document.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        document.head.appendChild(tag);
      }
      Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
    };

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  }, [description, title]);
}

function MarketingLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  useWebSeo({ title, description });

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title }} />
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, Spacing.lg),
            paddingBottom: insets.bottom + Spacing.xxl,
          },
        ]}
      >
        <View style={styles.page}>
          <MarketingHeader compact={compact} colors={colors} />
          {children}
          <MarketingFooter compact={compact} colors={colors} />
        </View>
      </ScrollView>
    </>
  );
}

function MarketingHeader({ compact, colors }: { compact: boolean; colors: MarketingColors }) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <MarketingPressLink href={HOME_ROUTE} style={styles.brandLink}>
        <Image
          source={LANDING_IMAGES.appIcon}
          style={styles.logoImage}
          resizeMode="cover"
          accessibilityLabel="Icono de Flowya"
        />
        <Text style={[styles.brandText, { color: colors.text }]}>Flowya</Text>
      </MarketingPressLink>
      <View style={[styles.headerNav, compact && styles.headerNavCompact]}>
        <InlineLink href={SUPPORT_ROUTE} label="Support" colors={colors} />
        <InlineLink href={PRIVACY_ROUTE} label="Privacy" colors={colors} />
      </View>
    </View>
  );
}

function MarketingPressLink({
  href,
  children,
  style,
}: {
  href: Href & string;
  children: React.ReactNode;
  style: object;
}) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => (router.push as (nextHref: string) => void)(href)}
      style={({ pressed }) => [style, WebTouchManipulation, pressed && { opacity: 0.82 }]}
    >
      {children}
    </Pressable>
  );
}

function MarketingFooter({ compact, colors }: { compact: boolean; colors: MarketingColors }) {
  return (
    <View style={[styles.footer, compact && styles.footerCompact, { borderTopColor: colors.borderSubtle }]}>
      <Text style={[styles.footerCopy, { color: colors.textSecondary }]}>
        Flowya helps people discover places visually and keep travel ideas organized.
      </Text>
      <View style={[styles.footerLinks, compact && styles.footerLinksCompact]}>
        <InlineLink href={SUPPORT_ROUTE} label="Support" colors={colors} />
        <InlineLink href={PRIVACY_ROUTE} label="Privacy" colors={colors} />
      </View>
    </View>
  );
}

function InlineLink({ href, label, colors }: { href: Href & string; label: string; colors: MarketingColors }) {
  return (
    <MarketingPressLink href={href} style={styles.inlineLink}>
      <Text style={[styles.inlineLinkText, { color: colors.primary }]}>{label}</Text>
    </MarketingPressLink>
  );
}

function CtaLink({
  href,
  label,
  variant,
  colors,
}: {
  href: Href & string;
  label: string;
  variant: 'primary' | 'secondary';
  colors: MarketingColors;
}) {
  const isPrimary = variant === 'primary';
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => (router.push as (nextHref: string) => void)(href)}
      style={({ pressed }) => [
        styles.cta,
        WebNoTextSelect,
        WebTouchManipulation,
        isPrimary
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.backgroundElevated, borderColor: colors.border },
        pressed && { opacity: 0.86 },
      ]}
    >
      <Text style={[styles.ctaText, { color: isPrimary ? '#ffffff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function AppStoreCta({ colors }: { colors: MarketingColors }) {
  return (
    <View
      accessibilityRole="text"
      style={[
        styles.cta,
        styles.appStoreCta,
        WebNoTextSelect,
        { backgroundColor: colors.text, borderColor: colors.text },
      ]}
    >
      <Text style={styles.appStoreCtaSmall}>Coming soon on</Text>
      <Text style={styles.appStoreCtaText}>App Store</Text>
    </View>
  );
}

function SupportContactCard({ colors }: { colors: MarketingColors }) {
  return (
    <View style={[styles.supportContactCard, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
      <View style={styles.supportContactHeader}>
        <Image source={LANDING_IMAGES.appIcon} style={styles.supportContactIcon} resizeMode="cover" />
        <View style={styles.supportContactTitleWrap}>
          <Text style={[styles.supportContactTitle, { color: colors.text }]}>Direct contact</Text>
          <Text style={[styles.supportContactSubtitle, { color: colors.textSecondary }]}>Email response</Text>
        </View>
      </View>
      <MailLink colors={colors} />
      <View style={[styles.supportDivider, { backgroundColor: colors.borderSubtle }]} />
      <Text style={[styles.supportContactHint, { color: colors.textSecondary }]}>
        Include your device, browser or iOS version, and a screenshot if it helps explain the issue.
      </Text>
    </View>
  );
}

function MailLink({ colors }: { colors: MarketingColors }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      style={({ pressed }) => [styles.mailLink, WebTouchManipulation, pressed && { opacity: 0.78 }]}
    >
      <Text style={[styles.mailLinkText, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
    </Pressable>
  );
}

function Section({
  eyebrow,
  title,
  body,
  children,
  colors,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  colors: MarketingColors;
}) {
  return (
    <View style={styles.section}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      {body ? <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{body}</Text> : null}
      {children}
    </View>
  );
}

function InfoCard({
  title,
  body,
  colors,
}: {
  title: string;
  body: string;
  colors: MarketingColors;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

function FaqItem({
  question,
  answer,
  colors,
}: {
  question: string;
  answer: React.ReactNode;
  colors: MarketingColors;
}) {
  return (
    <View style={[styles.faqItem, { borderBottomColor: colors.borderSubtle }]}>
      <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
      <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
    </View>
  );
}

function DeviceFrame({
  source,
  label,
  size = 'large',
  offset = 'none',
  colors,
}: {
  source: number;
  label: string;
  size?: 'large' | 'medium' | 'small';
  offset?: 'none' | 'left' | 'right';
  colors: MarketingColors;
}) {
  return (
    <View
      style={[
        styles.deviceFrame,
        size === 'medium' && styles.deviceFrameMedium,
        size === 'small' && styles.deviceFrameSmall,
        offset === 'left' && styles.deviceOffsetLeft,
        offset === 'right' && styles.deviceOffsetRight,
        { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle },
      ]}
    >
      <Image source={source} style={styles.deviceImage} resizeMode="cover" accessibilityLabel={label} />
    </View>
  );
}

function FeatureStory({
  eyebrow,
  title,
  body,
  source,
  reverse,
  compact,
  colors,
}: {
  eyebrow: string;
  title: string;
  body: string;
  source: number;
  reverse?: boolean;
  compact: boolean;
  colors: MarketingColors;
}) {
  return (
    <View
      style={[
        styles.storyRow,
        reverse && !compact && styles.storyRowReverse,
        compact && styles.storyRowCompact,
        { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.storyCopy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={[styles.storyTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{body}</Text>
      </View>
      <View style={[styles.storyImageWrap, { backgroundColor: colors.background }]}>
        <Image source={source} style={styles.storyImage} resizeMode="cover" accessibilityLabel={title} />
      </View>
    </View>
  );
}

export function LandingPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <MarketingLayout
      title="Flowya | Discover places and organize travel ideas"
      description="Flowya is an app for discovering places visually, saving travel ideas, and organizing personal trips."
    >
      <View style={styles.landingShell}>
        <View style={styles.heroIntro}>
          <View style={[styles.heroBadge, { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle }]}>
            <Image source={LANDING_IMAGES.appIcon} style={styles.heroBadgeIcon} resizeMode="cover" />
            <Text style={[styles.heroBadgeText, { color: colors.textSecondary }]}>Personal place discovery</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.heroTitle, compact && styles.heroTitleCompact, { color: colors.text }]}>
            Discover places worth coming back to.
          </Text>
          <Text style={[styles.heroBody, compact && styles.heroBodyCompact, { color: colors.textSecondary }]}>
            Flowya turns place discovery into a calm, visual way to find ideas, review search results, and keep track of places you want to visit or remember.
          </Text>
          <View style={[styles.ctaRow, styles.heroCtaRow, compact && styles.ctaRowCompact]}>
            <AppStoreCta colors={colors} />
            <CtaLink href={SUPPORT_ROUTE} label="Get support" variant="secondary" colors={colors} />
          </View>
        </View>

        <View style={[styles.heroShowcase, compact && styles.heroShowcaseCompact]}>
          <ImageBackground
            source={LANDING_IMAGES.landingAtmosphere}
            resizeMode="cover"
            style={styles.heroAtmosphere}
            imageStyle={styles.heroAtmosphereImage}
            accessibilityIgnoresInvertColors
          />
          <DeviceFrame source={LANDING_IMAGES.explore} label="Flowya screenshot showing Explore" colors={colors} />
          {!compact ? (
            <>
              <DeviceFrame
                source={LANDING_IMAGES.searchResults}
                label="Flowya screenshot with search results"
                size="medium"
                offset="left"
                colors={colors}
              />
              <DeviceFrame
                source={LANDING_IMAGES.passport}
                label="Flowya screenshot with Passport"
                size="small"
                offset="right"
                colors={colors}
              />
            </>
          ) : null}
        </View>

        <View style={[styles.metricStrip, compact && styles.metricStripCompact, { borderColor: colors.borderSubtle }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>Explore</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Explore places visually</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>Search</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Find ideas by city or interest</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>Lists</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Organize places to revisit</Text>
          </View>
        </View>
      </View>

      <Section
        eyebrow="What it does"
        title="A simple way to explore places"
        body="Flowya focuses on visual place discovery: browse points of interest, review place details, and keep personal travel ideas when account features are available."
        colors={colors}
      >
        <View style={[styles.cardGrid, compact && styles.cardGridCompact]}>
          <InfoCard title="Explore visually" body="Browse places and move through areas you are curious about." colors={colors} />
          <InfoCard title="Save intent" body="Mark places as planned or visited when those features are available for your account." colors={colors} />
          <InfoCard title="Review details" body="Open useful place information from the app experience." colors={colors} />
        </View>
      </Section>

      <FeatureStory
        eyebrow="Search"
        title="Move from an idea to places you can review."
        body="Search helps turn a city, landmark, or travel idea into results you can inspect visually. Flowya does not promise bookings or turn-by-turn navigation; it focuses on discovery and organization."
        source={LANDING_IMAGES.searchResults}
        compact={compact}
        colors={colors}
      />

      <FeatureStory
        eyebrow="Organize"
        title="Keep meaningful places close."
        body="When account features are available, you can save places and build a more personal view of the spots you want to visit or remember."
        source={LANDING_IMAGES.flow}
        reverse
        compact={compact}
        colors={colors}
      />

      <Section
        eyebrow="Privacy"
        title="Clear information for users and iOS review"
        body="The public privacy policy is available without sign-in. You can also contact support for questions about data or deletion requests."
        colors={colors}
      >
        <View style={styles.sectionActions}>
          <CtaLink href={PRIVACY_ROUTE} label="View privacy" variant="secondary" colors={colors} />
        </View>
      </Section>

      <Section
        eyebrow="Support"
        title="Public help, no sign-in required"
        body="The support page includes a visible email contact, FAQ, privacy links, and guidance for users and Apple reviewers."
        colors={colors}
      >
        <View style={styles.sectionActions}>
          <CtaLink href={SUPPORT_ROUTE} label="Go to support" variant="primary" colors={colors} />
        </View>
      </Section>
    </MarketingLayout>
  );
}

export function SupportPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const compact = width < 760;

  const supportLinks: MarketingLink[] = [
    { label: 'View privacy', href: PRIVACY_ROUTE },
    { label: 'Back to home', href: HOME_ROUTE },
  ];

  return (
    <MarketingLayout
      title="Flowya Support"
      description="Public Flowya support with contact, privacy, help, and FAQ information for users and app review."
    >
      <View
        style={[
          styles.supportHero,
          compact && styles.supportHeroCompact,
          { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle },
        ]}
      >
        <Image
          source={LANDING_IMAGES.supportAtmosphere}
          style={styles.supportAtmosphere}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.supportHeroCopy}>
          <View style={[styles.heroBadge, styles.supportBadge, { backgroundColor: colors.background, borderColor: colors.borderSubtle }]}>
            <Image source={LANDING_IMAGES.appIcon} style={styles.heroBadgeIcon} resizeMode="cover" />
            <Text style={[styles.heroBadgeText, { color: colors.textSecondary }]}>Public help, no sign-in</Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.supportHeroTitle, compact && styles.supportHeroTitleCompact, { color: colors.text }]}
          >
            Flowya Support
          </Text>
          <Text style={[styles.supportHeroBody, { color: colors.textSecondary }]}>
            Find contact details, privacy information, and quick answers for users and app review. If something does not load or you need help with data requests, email us directly.
          </Text>
          <View style={[styles.supportQuickLinks, compact && styles.supportQuickLinksCompact]}>
            {supportLinks.map((item) => (
              <CtaLink key={item.href} href={item.href} label={item.label} variant="secondary" colors={colors} />
            ))}
          </View>
        </View>

        <View style={[styles.supportHeroVisual, compact && styles.supportHeroVisualCompact]}>
          <View
            style={[
              styles.supportScreenshotCard,
              compact && styles.supportScreenshotCardCompact,
              { backgroundColor: colors.background, borderColor: colors.borderSubtle },
            ]}
          >
            <Image
              source={LANDING_IMAGES.searchResults}
              style={styles.supportScreenshot}
              resizeMode="cover"
              accessibilityLabel="Flowya support screenshot"
            />
          </View>
          <SupportContactCard colors={colors} />
        </View>
      </View>

      <Section
        eyebrow="What Flowya is"
        title="A place discovery app"
        body="Flowya helps people discover places visually, review details, and organize personal travel ideas such as places to visit or places already visited when account features are available."
        colors={colors}
      />

      <Section
        eyebrow="Help"
        title="How to get help"
        body={`Email ${SUPPORT_EMAIL} with a description of the issue, the device or browser you are using, and screenshots if they help explain the case.`}
        colors={colors}
      />

      <Section eyebrow="FAQ" title="Common questions" colors={colors}>
        <View style={[styles.faqList, { backgroundColor: colors.backgroundElevated, borderColor: colors.borderSubtle }]}>
          <FaqItem
            question="How do I report a problem?"
            answer={`Email ${SUPPORT_EMAIL} and include what you were trying to do, where it happened, and any visible error message.`}
            colors={colors}
          />
          <FaqItem
            question="Why is the app not loading?"
            answer="Check your connection, reload the page, and confirm that your browser allows the app content to load. If the issue continues, contact support with your device and browser details."
            colors={colors}
          />
          <FaqItem
            question="How do I manage my data?"
            answer={`For questions about data associated with your Flowya use, email ${SUPPORT_EMAIL}. If you have an account, include the email associated with it so we can locate your request.`}
            colors={colors}
          />
          <FaqItem
            question="Where is the privacy policy?"
            answer="The public privacy policy is linked from this page, the landing page, and the footer."
            colors={colors}
          />
          <FaqItem
            question="How do I contact the team?"
            answer={`The public contact channel is ${SUPPORT_EMAIL}. The email link on this page opens your mail client with mailto:.`}
            colors={colors}
          />
        </View>
      </Section>

      <Section
        eyebrow="Privacy and data"
        title="Privacy, account, or deletion requests"
        body={`If you need to request access, correction, or deletion of data related to Flowya, email ${SUPPORT_EMAIL}. If you do not have an account or do not remember creating one, you can still contact us so we can review the request.`}
        colors={colors}
      >
        <View style={styles.sectionActions}>
          <CtaLink href={PRIVACY_ROUTE} label="Open privacy policy" variant="secondary" colors={colors} />
        </View>
      </Section>

      <Section
        eyebrow="Contact"
        title="Support email"
        body="Public support does not depend on a backend form. Use the visible email address to contact us directly."
        colors={colors}
      >
        <MailLink colors={colors} />
      </Section>
    </MarketingLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  page: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    gap: 72,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  headerCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  brandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  headerNavCompact: {
    width: '100%',
  },
  inlineLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  inlineLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.xl,
  },
  heroCompact: {
    flexDirection: 'column',
  },
  heroCopy: {
    flex: 1.2,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  heroKicker: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...TypographyStyles.heading1,
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -2.2,
    maxWidth: 900,
    textAlign: 'center',
  },
  heroTitleCompact: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.1,
  },
  heroBody: {
    ...TypographyStyles.body,
    maxWidth: 640,
    textAlign: 'center',
  },
  heroBodyCompact: {
    fontSize: 16,
    lineHeight: 24,
  },
  landingShell: {
    gap: Spacing.xl,
  },
  heroIntro: {
    alignItems: 'center',
    gap: Spacing.base,
    paddingTop: Spacing.xl,
  },
  heroBadge: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  heroCtaRow: {
    justifyContent: 'center',
  },
  heroShowcase: {
    minHeight: 650,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  heroShowcaseCompact: {
    minHeight: 540,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 280,
    opacity: 0.1,
  },
  heroAtmosphere: {
    position: 'absolute',
    width: '100%',
    height: 540,
    borderRadius: 42,
    overflow: 'hidden',
    opacity: 0.96,
  },
  heroAtmosphereImage: {
    borderRadius: 42,
  },
  deviceFrame: {
    width: 310,
    height: 670,
    borderRadius: 44,
    borderWidth: 1,
    padding: 8,
    overflow: 'hidden',
    borderColor: 'rgba(0,0,0,0.08)',
    ...Elevation.raised,
  },
  deviceFrameMedium: {
    position: 'absolute',
    width: 230,
    height: 498,
    borderRadius: 36,
  },
  deviceFrameSmall: {
    position: 'absolute',
    width: 176,
    height: 382,
    borderRadius: 30,
  },
  deviceOffsetLeft: {
    left: 84,
    bottom: 46,
    transform: [{ rotate: '-8deg' }],
  },
  deviceOffsetRight: {
    right: 108,
    top: 74,
    transform: [{ rotate: '9deg' }],
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  metricStrip: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  metricStripCompact: {
    flexDirection: 'column',
  },
  metricItem: {
    flex: 1,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  ctaRowCompact: {
    width: '100%',
  },
  cta: {
    minHeight: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
  },
  appStoreCta: {
    gap: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    minWidth: 178,
  },
  appStoreCtaSmall: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    opacity: 0.82,
    textAlign: 'center',
  },
  appStoreCtaText: {
    color: '#ffffff',
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  heroPanel: {
    flex: 0.8,
    minHeight: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    gap: Spacing.md,
    ...Elevation.card,
  },
  mapPreview: {
    flex: 1,
    minHeight: 220,
    borderRadius: 24,
    overflow: 'hidden',
  },
  routeLine: {
    position: 'absolute',
    width: 6,
    height: 170,
    borderRadius: 999,
    top: 36,
    left: '52%',
    opacity: 0.28,
    transform: [{ rotate: '32deg' }],
  },
  pinDot: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  pinDotOne: {
    top: 60,
    left: '28%',
  },
  pinDotTwo: {
    top: 128,
    right: '22%',
  },
  pinDotThree: {
    bottom: 52,
    left: '46%',
  },
  heroPanelTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  section: {
    gap: Spacing.md,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    ...TypographyStyles.heading2,
    maxWidth: 760,
  },
  sectionBody: {
    ...TypographyStyles.body,
    maxWidth: 760,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  cardGridCompact: {
    flexDirection: 'column',
  },
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  storyRow: {
    borderWidth: 1,
    borderRadius: 32,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    overflow: 'hidden',
  },
  storyRowReverse: {
    flexDirection: 'row-reverse',
  },
  storyRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: Spacing.lg,
  },
  storyCopy: {
    flex: 1,
    gap: Spacing.md,
  },
  storyTitle: {
    ...TypographyStyles.heading2,
    maxWidth: 540,
  },
  storyImageWrap: {
    flex: 1,
    minHeight: 520,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  sectionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.base,
  },
  footerCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  footerCopy: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  footerLinksCompact: {
    width: '100%',
  },
  supportHero: {
    position: 'relative',
    borderRadius: 36,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Elevation.card,
  },
  supportAtmosphere: {
    position: 'absolute',
    right: -40,
    top: 0,
    width: '64%',
    height: '100%',
    opacity: 0.42,
  },
  supportHeroCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: Spacing.lg,
  },
  supportHeroCopy: {
    flex: 1.1,
    gap: Spacing.base,
  },
  supportBadge: {
    alignSelf: 'flex-start',
  },
  supportHeroTitle: {
    ...TypographyStyles.heading1,
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: -1.4,
    maxWidth: 560,
  },
  supportHeroTitleCompact: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  supportHeroBody: {
    ...TypographyStyles.body,
    maxWidth: 620,
  },
  supportHeroVisual: {
    flex: 0.9,
    minHeight: 440,
    justifyContent: 'center',
  },
  supportHeroVisualCompact: {
    width: '100%',
    minHeight: 360,
  },
  supportScreenshotCard: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 230,
    height: 420,
    borderRadius: 34,
    borderWidth: 1,
    padding: 7,
    overflow: 'hidden',
    transform: [{ rotate: '5deg' }],
    opacity: 0.92,
    ...Elevation.card,
  },
  supportScreenshotCardCompact: {
    width: 180,
    height: 320,
    right: 8,
    top: 6,
  },
  supportScreenshot: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: '#f3f4f6',
  },
  supportContactCard: {
    width: '82%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Elevation.raised,
  },
  supportContactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supportContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  supportContactTitleWrap: {
    flex: 1,
    gap: 2,
  },
  supportContactTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  supportContactSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  supportDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  supportContactHint: {
    fontSize: 14,
    lineHeight: 21,
  },
  supportQuickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  supportQuickLinksCompact: {
    flexDirection: 'column',
  },
  mailLink: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  mailLinkText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
  },
  faqList: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  faqQuestion: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 23,
  },
});
