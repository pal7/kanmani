export const en = {
  appName: 'கண்மணி',
  tagline: 'Bilingual AI · Tamil + English',
  signIn: 'Sign in',
  signUp: 'Create account',
  signOut: 'Sign out',
  continueWithGoogle: 'Continue with Google',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Password',
  noAccount: "Don't have an account?",
  hasAccount: 'Already have an account?',
  inputPlaceholder: 'Message Kanmani…',
  noChats: 'No conversations yet',
  newConversation: 'New conversation',
  toggleLang: 'தமிழ்',
  checkEmail: 'Check your email to confirm your account.',
  welcome: "Hi! I'm Kanmani, your bilingual Tamil-English assistant.",
  or: 'or',
} as const;

export type TranslationKey = keyof typeof en;
