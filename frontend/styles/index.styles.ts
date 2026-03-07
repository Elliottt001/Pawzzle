import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.backgroundAuth,
  },
  container: {
    flex: Theme.layout.full,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  profileBackdrop: {
    position: 'absolute',
    width: 378,
    height: 315,
    left: -3,
    top: -3,
  },
  authGlow: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: Theme.radius.pill,
  },
  authGlowTop: {
    top: 146,
    left: -67,
    backgroundColor: Theme.colors.authGlowWarm,
  },
  authGlowBottom: {
    top: 424,
    right: -50,
    backgroundColor: Theme.colors.authGlowWarm,
  },
  authGlowCenter: {
    top: 478,
    right: -50,
    backgroundColor: Theme.colors.authGlowYellow,
  },
  header: {
    paddingHorizontal: Theme.spacing.s20,
    paddingTop: Theme.spacing.s12,
    paddingBottom: Theme.spacing.s8,
  },
  overline: {
    fontSize: Theme.typography.size.s11,
    letterSpacing: Theme.typography.letterSpacing.s3,
    textTransform: 'uppercase',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.s6,
  },
  title: {
    fontSize: Theme.typography.size.s22,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  content: {
    paddingHorizontal: Theme.spacing.s20,
    paddingBottom: Theme.sizes.s140,
    gap: Theme.spacing.s16,
  },
  authContent: {
    flexGrow: Theme.layout.full,
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.s24,
    paddingTop: Theme.spacing.s40,
    paddingBottom: Theme.spacing.s40,
    gap: Theme.spacing.s24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s8,
  },
  backText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textWarm,
  },
  brandBlock: {
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  brandLogo: {
    width: Theme.sizes.s140,
    height: Theme.sizes.s140,
  },
  brandText: {
    fontSize: Theme.typography.size.s32,
    fontFamily: Theme.fonts.brand,
    color: Theme.colors.authBrandTitle,
    letterSpacing: 1.92,
  },
  brandTextEnglish: {
    fontSize: Theme.typography.size.s32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.authBrandTitle,
    letterSpacing: 1.92,
  },
  authStack: {
    width: Theme.percent.p100,
    alignItems: 'center',
    gap: Theme.spacing.s12,
  },
  authButton: {
    width: 279,
    height: 45,
    borderRadius: 30,
    borderWidth: Theme.borderWidth.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonPrimary: {
    backgroundColor: Theme.colors.ctaBackground,
    borderColor: Theme.colors.ctaBackground,
  },
  authButtonWeChat: {
    backgroundColor: Theme.colors.authWeChatBg,
    borderColor: Theme.colors.authWeChatBg,
  },
  authButtonInstitution: {
    backgroundColor: Theme.colors.authDarkBrown,
    borderColor: Theme.colors.authDarkBrown,
  },
  authButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  authButtonText: {
    fontSize: Theme.typography.size.s15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.authPrimaryText,
  },
  authButtonTextWeChat: {
    color: Theme.colors.authDarkBrown,
  },
  authButtonTextInverse: {
    color: Theme.colors.authInstitutionText,
  },
  guestLink: {
    paddingVertical: Theme.spacing.s4,
  },
  guestText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.authHint,
    textDecorationLine: 'underline',
  },
  registerHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.authHint,
    textAlign: 'center',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: Theme.percent.p80,
    gap: Theme.spacing.s6,
  },
  agreementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.authHint,
    marginTop: Theme.spacing.s2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementDotActive: {
    borderColor: Theme.colors.primary,
  },
  agreementText: {
    flex: Theme.layout.full,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.authHint,
    lineHeight: Theme.typography.lineHeight.s20,
    letterSpacing: 0.72,
  },
  agreementLink: {
    color: Theme.colors.codeLinkBlue,
  },
  authStatus: {
    marginTop: Theme.spacing.s6,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 279,
    height: 45,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.authDarkBrown,
    borderRadius: 30,
    backgroundColor: Theme.colors.transparent,
  },
  phonePrefix: {
    width: 40,
    height: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.inputBorderLight,
    borderRightWidth: 0.5,
    borderRightColor: Theme.colors.inputBorderLight,
    overflow: 'hidden',
  },
  phoneInputField: {
    flex: Theme.layout.full,
    paddingHorizontal: Theme.spacing.s12,
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.authDarkBrown,
  },
  ctaButton: {
    width: 279,
    height: 45,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.ctaBackground,
  },
  ctaButtonDisabled: {
    backgroundColor: Theme.colors.disabledBg,
  },
  ctaButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  ctaButtonText: {
    fontSize: Theme.typography.size.s15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.authDarkBrown,
  },
  ctaButtonTextDisabled: {
    color: Theme.colors.textInverse,
  },
  codeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 279,
  },
  codeHintLabel: {
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.codeHintLabel,
  },
  codeHintPhone: {
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.codeHintPhone,
    textAlign: 'right',
    flex: Theme.layout.full,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 17,
  },
  codeBox: {
    width: 57,
    height: 53,
    borderRadius: Theme.radius.r20,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.authDarkBrown,
    backgroundColor: Theme.colors.transparent,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: Theme.typography.size.s20,
    color: Theme.colors.authDarkBrown,
  },
  codeBoxFilled: {
    borderColor: Theme.colors.authDarkBrown,
  },
  codeBoxFocused: {
    borderColor: Theme.colors.authDarkBrown,
    backgroundColor: Theme.colors.card,
  },
  codeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 279,
    marginTop: Theme.spacing.s6,
  },
  codeFooterLink: {
    fontSize: 10,
    color: Theme.colors.codeLinkBlue,
  },
  codeFooterHint: {
    fontSize: 10,
    color: Theme.colors.codeCountdown,
  },
  codeFooterHintDisabled: {
    color: Theme.colors.codeCountdown,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  loadingText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarmStrong,
  },
  nicknameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Theme.spacing.s8,
  },
  nicknameTitle: {
    fontSize: Theme.typography.size.s32,
    fontFamily: Theme.fonts.brand,
    color: Theme.colors.authBrandTitle,
    letterSpacing: 1.92,
  },
  nicknameInput: {
    width: 279,
    height: 45,
    borderRadius: 30,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.authDarkBrown,
    backgroundColor: Theme.colors.transparent,
    paddingHorizontal: Theme.spacing.s20,
    fontSize: Theme.typography.size.s15,
    color: Theme.colors.authDarkBrown,
  },
  wechatCard: {
    width: Theme.percent.p80,
    borderRadius: Theme.radius.r18,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmStrong,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    paddingVertical: Theme.spacing.s20,
    paddingHorizontal: Theme.spacing.s16,
    alignItems: 'center',
    gap: Theme.spacing.s10,
  },
  wechatTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  wechatHint: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  institutionInput: {
    width: 279,
    height: 45,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#5C4033',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingRight: 45,
    fontSize: 15,
    color: Theme.colors.textWarmStrong,
  },
  institutionInputWrap: {
    position: 'relative' as const,
    width: 279,
    height: 45,
  },
  institutionClearBtn: {
    position: 'absolute' as const,
    right: 12,
    top: 15,
    width: 15,
    height: 15,
    borderRadius: 9999,
    backgroundColor: '#D9D9D9',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  institutionClearText: {
    color: 'white',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700' as const,
  },
  profileCard: {
    marginTop: Theme.spacing.s8,
    padding: Theme.spacing.s20,
    alignItems: 'center',
  },
  avatarWrap: {
    width: Theme.sizes.s96,
    height: Theme.sizes.s96,
    borderRadius: Theme.radius.r48,
    backgroundColor: Theme.colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.s12,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  avatarPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  avatar: {
    width: Theme.sizes.s68,
    height: Theme.sizes.s68,
  },
  name: {
    fontSize: Theme.typography.size.s20,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  nicknameLabel: {
    marginTop: Theme.spacing.s12,
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: Theme.typography.letterSpacing.s1_6,
  },
  nicknamePill: {
    marginTop: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.successSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successBorder,
  },
  nicknameText: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.successStrong,
    fontFamily: Theme.fonts.semiBold,
  },
  userTypePill: {
    marginTop: Theme.spacing.s6,
    paddingHorizontal: Theme.spacing.s14,
    paddingVertical: Theme.spacing.s6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.warningSurface,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.warningBorder,
  },
  userTypeText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.warningText,
    fontFamily: Theme.fonts.semiBold,
  },
  emailText: {
    marginTop: Theme.spacing.s10,
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  statusText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textEmphasis,
  },
  sectionCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r20,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    gap: Theme.spacing.s12,
    ...Theme.shadows.cardSoftLarge,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  adoptionList: {
    gap: Theme.spacing.s16,
  },
  adoptionItem: {
    gap: Theme.spacing.s10,
  },
  adoptionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.s8,
  },
  adoptionMetaLabel: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textSecondary,
  },
  adoptionMetaPill: {
    paddingHorizontal: Theme.spacing.s10,
    paddingVertical: Theme.spacing.s2,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surfaceWarm,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarmSoft,
  },
  adoptionMetaText: {
    fontSize: Theme.typography.size.s12,
    color: Theme.colors.textWarm,
    fontFamily: Theme.fonts.semiBold,
  },
  petsList: {
    gap: Theme.spacing.s12,
  },
  emptyText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
  },
  errorText: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textError,
  },
  formCard: {
    padding: Theme.spacing.s18,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.radius.r20,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    ...Theme.shadows.elevatedSoft,
  },
  formTitle: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.s12,
  },
  formSubtitle: {
    fontSize: Theme.typography.size.s13,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.s12,
  },
  actionButton: {
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.ctaBorder,
    paddingVertical: Theme.spacing.s12,
    borderRadius: Theme.radius.r14,
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
  actionButtonText: {
    color: Theme.colors.ctaText,
    fontSize: Theme.typography.size.s14,
    fontFamily: Theme.fonts.semiBold,
  },
  institutionFab: {
    position: 'absolute',
    right: Theme.spacing.s20,
    bottom: Theme.sizes.s120,
    width: Theme.sizes.s56,
    height: Theme.sizes.s56,
    borderRadius: Theme.sizes.s56 / 2,
    backgroundColor: Theme.colors.successDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successDeep,
    ...Theme.shadows.card,
  },
  institutionFabPressed: {
    transform: [{ scale: Theme.scale.pressedSoft }],
  },
});

/* ═══════════════════════════════════════════
 *  Home page – redesigned profile view
 *  Split into view / text / image sheets
 *  to preserve proper TS types.
 * ═══════════════════════════════════════════ */
const homeViewStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 140,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  userBadge: {
    paddingHorizontal: 8,
    backgroundColor: '#ED843F',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCard: {
    width: '100%' as unknown as number,
    borderRadius: 24,
    paddingLeft: 5,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 1,
    overflow: 'hidden',
  },
  aiRow: {
    width: 244,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconWrap: {
    width: 39.55,
    padding: 10,
  },
  aiChecklist: {
    width: 236,
  },
  aiCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxWrap: {
    width: 24,
    paddingHorizontal: 4,
    paddingVertical: 7,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 11,
    height: 10,
    borderWidth: 1.5,
    borderColor: '#5C4033',
    borderRadius: 2,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  petAddBtn: {
    padding: 8,
    backgroundColor: '#ED843F',
    borderRadius: 28,
    shadowColor: 'rgba(237, 132, 63, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  petList: {
    gap: 16,
    alignItems: 'center',
  },
  accountCard: {
    marginTop: 20,
  },
  logoutBtn: {
    backgroundColor: Theme.colors.ctaBackground,
    borderWidth: 1,
    borderColor: Theme.colors.ctaBorder,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
});

const homeTextStyles = StyleSheet.create({
  userName: {
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 26,
    letterSpacing: 1.08,
  },
  userId: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  userIp: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  userBadgeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.72,
  },
  bioHint: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 26,
    letterSpacing: 1.08,
    marginTop: 8,
  },
  aiTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 23,
  },
  checkText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: '#5C4033',
    lineHeight: 20,
  },
  logoutText: {
    color: Theme.colors.ctaText,
    fontSize: 14,
    fontFamily: Theme.fonts.semiBold,
  },
});

const homeImageStyles = StyleSheet.create({
  avatar: {
    width: 71,
    height: 72,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#F4C17F',
  },
});

export const homeStyles = {
  ...homeViewStyles,
  ...homeTextStyles,
  ...homeImageStyles,
};
