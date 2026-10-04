import type { Lang, Occupation, Gender, Relation, Text } from './types'
import { pickText } from './lang'

export const STRINGS = {
  appTagline: { en: 'Government schemes, found by voice', ta: 'அரசுத் திட்டங்கள், உங்கள் குரலில்' },
  chooseLanguage: { en: 'Choose your language', ta: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்' },
  notOfficial: { en: 'Not an official government app', ta: 'இது அதிகாரப்பூர்வ அரசு செயலி அல்ல' },

  consentTitle: { en: 'Before we start', ta: 'தொடங்குவதற்கு முன்' },
  consentLead: {
    en: 'GoScheme asks a few questions to find schemes for you and your family.',
    ta: 'உங்களுக்கும் உங்கள் குடும்பத்திற்கும் ஏற்ற திட்டங்களைக் கண்டறிய GoScheme சில கேள்விகள் கேட்கும்.',
  },
  consentWhatT: { en: 'What we ask', ta: 'நாங்கள் கேட்பவை' },
  consentWhat: {
    en: 'Name, age, gender, work, family income, district and family size.',
    ta: 'பெயர், வயது, பாலினம், வேலை, குடும்ப வருமானம், மாவட்டம், குடும்ப உறுப்பினர் எண்ணிக்கை.',
  },
  consentWhyT: { en: 'Why', ta: 'ஏன்' },
  consentWhy: {
    en: 'Only to check which schemes you can get and to fill your forms.',
    ta: 'நீங்கள் பெறக்கூடிய திட்டங்களைச் சரிபார்க்கவும் படிவங்களை நிரப்பவும் மட்டுமே.',
  },
  consentWhereT: { en: 'Where it stays', ta: 'எங்கே சேமிக்கப்படும்' },
  consentWhere: {
    en: 'Encrypted on this phone only. Aadhaar is saved as the last 4 digits only. Document photos are never saved.',
    ta: 'இந்த மொபைலில் மட்டும், மறைகுறியாக்கப்பட்டு. ஆதாரின் கடைசி 4 இலக்கங்கள் மட்டுமே சேமிக்கப்படும். ஆவணப் புகைப்படங்கள் சேமிக்கப்படுவதில்லை.',
  },
  consentDeleteT: { en: 'Delete any time', ta: 'எப்போது வேண்டுமானாலும் நீக்கலாம்' },
  consentDelete: {
    en: 'Family → Delete all my data removes everything.',
    ta: 'குடும்பம் → எனது எல்லா தரவையும் நீக்கு — அனைத்தையும் அழிக்கும்.',
  },
  consentAgree: { en: 'I agree, start', ta: 'ஒப்புக்கொள்கிறேன், தொடங்கு' },
  consentLaw: { en: 'As required by the DPDP Act, 2023', ta: 'DPDP சட்டம், 2023-இன் படி' },

  intro: {
    en: "Hello! I'll ask a few simple questions to find government schemes for you.",
    ta: 'வணக்கம்! உங்களுக்கான அரசுத் திட்டங்களைக் கண்டறிய, சில எளிய கேள்விகள் கேட்கிறேன்.',
  },
  question: { en: 'Question', ta: 'கேள்வி' },
  of: { en: 'of', ta: '/' },
  listening: { en: 'Listening…', ta: 'கேட்கிறது…' },
  speaking: { en: 'Speaking…', ta: 'பேசுகிறது…' },
  tapToSpeak: { en: 'Tap the circle and speak', ta: 'வட்டத்தைத் தொட்டுப் பேசுங்கள்' },
  heardNothing: { en: "I didn't hear anything. Please say it again.", ta: 'எதுவும் கேட்கவில்லை. மீண்டும் சொல்லுங்கள்.' },
  unclear: { en: "That wasn't clear. Please say it again.", ta: 'தெளிவாக இல்லை. மீண்டும் சொல்லுங்கள்.' },
  sayAgain: { en: 'Please say it again.', ta: 'மீண்டும் சொல்லுங்கள்.' },
  tapInstead: { en: 'Tap or type your answer below.', ta: 'கீழே தொட்டு அல்லது தட்டச்சு செய்து பதிலளிக்கவும்.' },
  micBlocked: {
    en: 'Microphone is blocked. Allow it in the browser, or type your answer.',
    ta: 'மைக்ரோஃபோன் தடுக்கப்பட்டுள்ளது. உலாவியில் அனுமதிக்கவும், அல்லது தட்டச்சு செய்யவும்.',
  },
  noMicInPreview: {
    en: 'Voice answers need the full GoScheme app. Here, tap or type your answer.',
    ta: 'குரல் பதிலுக்கு முழு GoScheme செயலி தேவை. இங்கே தொட்டு அல்லது தட்டச்சு செய்து பதிலளிக்கவும்.',
  },
  noVoiceSupport: {
    en: 'Voice input needs Chrome. You can tap or type your answers.',
    ta: 'குரல் உள்ளீட்டுக்கு Chrome தேவை. தொட்டு அல்லது தட்டச்சு செய்து பதிலளிக்கலாம்.',
  },
  networkError: {
    en: 'Voice needs internet. Check the connection, or type your answer.',
    ta: 'குரலுக்கு இணையம் தேவை. இணைப்பைச் சரிபார்க்கவும், அல்லது தட்டச்சு செய்யவும்.',
  },
  type: { en: 'Type', ta: 'தட்டச்சு' },
  speak: { en: 'Speak', ta: 'பேசு' },
  repeat: { en: 'Repeat', ta: 'மீண்டும்' },
  next: { en: 'Next', ta: 'அடுத்து' },
  save: { en: 'Save', ta: 'சேமி' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  back: { en: 'Back', ta: 'பின்செல்' },
  searchDistrict: { en: 'Search district', ta: 'மாவட்டத்தைத் தேடுக' },
  yes: { en: 'Yes', ta: 'ஆம்' },
  no: { en: 'No', ta: 'இல்லை' },
  orTypeAmount: { en: 'Or type the exact amount (₹ a year)', ta: 'அல்லது சரியான தொகையை உள்ளிடவும் (ஆண்டுக்கு ₹)' },

  confirmTitle: { en: 'Is this correct?', ta: 'இவை சரியா?' },
  confirmLead: { en: 'Tap any answer to change it.', ta: 'மாற்ற எந்தப் பதிலையும் தொடவும்.' },
  showSchemes: { en: 'Show my schemes', ta: 'எனது திட்டங்களைக் காட்டு' },
  addToFamily: { en: 'Add to my family', ta: 'குடும்பத்தில் சேர்' },
  edit: { en: 'Edit', ta: 'திருத்து' },

  hello: { en: 'Hello', ta: 'வணக்கம்' },
  foundForFamily: { en: 'Found for your family', ta: 'உங்கள் குடும்பத்திற்காகக் கண்டறிந்தவை' },
  schemesMatch: { en: '{n} schemes match', ta: '{n} திட்டங்கள் பொருந்துகின்றன' },
  oneSchemeMatch: { en: '1 scheme matches', ta: '1 திட்டம் பொருந்துகிறது' },
  noneMatchYet: { en: 'No confirmed matches yet', ta: 'இன்னும் உறுதியான பொருத்தம் இல்லை' },
  worthCash: { en: '₹{amount} a year in cash', ta: 'ஆண்டுக்கு ₹{amount} பணப் பலன்' },
  toCheck: { en: '{n} more need 1 answer', ta: 'மேலும் {n} திட்டங்களுக்கு 1 பதில் தேவை' },
  canApplyOne: { en: 'scheme you can apply for', ta: 'திட்டத்திற்கு விண்ணப்பிக்கலாம்' },
  canApplyMany: { en: 'schemes you can apply for', ta: 'திட்டங்களுக்கு விண்ணப்பிக்கலாம்' },
  all: { en: 'All', ta: 'அனைவரும்' },
  eligibleSection: { en: 'You can apply', ta: 'விண்ணப்பிக்கலாம்' },
  maybeSection: { en: 'Answer 1 question to check', ta: 'சரிபார்க்க 1 கேள்விக்குப் பதிலளிக்கவும்' },
  notSection: { en: 'Not eligible right now', ta: 'தற்போது தகுதி இல்லை' },
  show: { en: 'Show', ta: 'காட்டு' },
  hide: { en: 'Hide', ta: 'மறை' },
  eligible: { en: 'Eligible', ta: 'தகுதி உண்டு' },
  maybe: { en: 'Maybe', ta: 'இருக்கலாம்' },
  notEligible: { en: 'Not eligible', ta: 'தகுதி இல்லை' },
  forWho: { en: 'For {who}', ta: '{who} — இவர்களுக்கு' },
  forYou: { en: 'For you', ta: 'உங்களுக்கு' },
  wholeFamily: { en: 'Whole family', ta: 'முழு குடும்பம்' },
  answerNow: { en: 'Answer', ta: 'பதிலளி' },
  addMember: { en: 'Add family member', ta: 'குடும்ப உறுப்பினரைச் சேர்' },
  addMemberHint: {
    en: 'Many schemes are for one person — a wife, a child in college, a parent over 60.',
    ta: 'பல திட்டங்கள் ஒருவருக்கானவை — மனைவி, கல்லூரியில் படிக்கும் பிள்ளை, 60 வயதைக் கடந்த பெற்றோர்.',
  },

  tabSchemes: { en: 'Schemes', ta: 'திட்டங்கள்' },
  tabForms: { en: 'My forms', ta: 'என் படிவங்கள்' },
  tabProfile: { en: 'Family', ta: 'குடும்பம்' },

  whoIsThisFor: { en: 'Who is this for?', ta: 'இது யாருக்காக?' },
  whoLead: { en: "We'll ask 4 short questions about them.", ta: 'அவரைப் பற்றி 4 சிறிய கேள்விகள் கேட்போம்.' },

  whatYouGet: { en: 'What you get', ta: 'கிடைப்பது' },
  whyTitle: { en: 'Why', ta: 'காரணம்' },
  howToFix: { en: 'What you can do', ta: 'நீங்கள் செய்யக்கூடியது' },
  docsNeeded: { en: 'Documents needed', ta: 'தேவையான ஆவணங்கள்' },
  officialSite: { en: 'Official website', ta: 'அதிகாரப்பூர்வ இணையதளம்' },
  fillApplication: { en: 'Fill the application', ta: 'விண்ணப்பத்தை நிரப்பு' },
  answerOneQuestion: { en: 'Answer 1 question', ta: '1 கேள்விக்குப் பதிலளி' },
  demoRules: {
    en: 'Eligibility rules are simplified for this demo. Check the official website before applying.',
    ta: 'இந்த டெமோவிற்காக தகுதி விதிகள் எளிமைப்படுத்தப்பட்டுள்ளன. விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ இணையதளத்தைப் பார்க்கவும்.',
  },
  updated: { en: 'Updated', ta: 'புதுப்பிக்கப்பட்டது' },
  tabOverview: { en: 'Overview', ta: 'சுருக்கம்' },
  tabEligibility: { en: 'Eligibility', ta: 'தகுதி' },
  tabApply: { en: 'How to apply', ta: 'விண்ணப்பம்' },
  yourCheck: { en: 'Your check', ta: 'உங்கள் தகுதிச் சரிபார்ப்பு' },
  benefitsTitle: { en: 'Benefits', ta: 'பலன்கள்' },
  aboutTitle: { en: 'About', ta: 'திட்டம் பற்றி' },
  officialRules: { en: 'Official eligibility', ta: 'அதிகாரப்பூர்வ தகுதிகள்' },
  exclusionsTitle: { en: 'Who cannot apply', ta: 'யார் விண்ணப்பிக்க முடியாது' },
  stepsTitle: { en: 'Steps', ta: 'படிகள்' },
  formsLinks: { en: 'Forms & links', ta: 'படிவங்கள் & இணைப்புகள்' },
  kindForm: { en: 'Application form', ta: 'விண்ணப்பப் படிவம்' },
  kindPortal: { en: 'Apply / website', ta: 'இணையதளம்' },
  kindGuidelines: { en: 'Guidelines', ta: 'வழிகாட்டுதல்கள்' },
  kindInfo: { en: 'More information', ta: 'மேலும் தகவல்' },
  sourceLine: { en: 'Source: {name} · checked {date}', ta: 'ஆதாரம்: {name} · சரிபார்த்தது {date}' },
  translatedBy: {
    en: '', ta: 'தமிழாக்கம்: myScheme. சந்தேகம் இருந்தால் ஆங்கிலப் பதிப்பைப் பார்க்கவும்.',
    hi: 'अनुवाद: myScheme. संदेह हो तो अंग्रेज़ी संस्करण देखें।',
    te: 'అనువాదం: myScheme. సందేహం ఉంటే ఆంగ్ల వెర్షన్ చూడండి.',
    kn: 'ಅನುವಾದ: myScheme. ಸಂದೇಹವಿದ್ದರೆ ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿಯನ್ನು ನೋಡಿ.',
  },
  whereToSubmit: { en: 'Where to submit', ta: 'எங்கே சமர்ப்பிப்பது' },

  reviewTitle: { en: 'Review your form', ta: 'உங்கள் படிவத்தைச் சரிபார்க்கவும்' },
  reviewLead: { en: 'Check and edit every field', ta: 'ஒவ்வொரு விவரத்தையும் சரிபார்க்கவும்' },
  fieldsFilled: { en: '{a} of {b} fields filled', ta: '{b}-இல் {a} விவரங்கள் நிரப்பப்பட்டன' },
  srcProfile: { en: 'Profile', ta: 'சுயவிவரம்' },
  srcDocument: { en: 'Document', ta: 'ஆவணம்' },
  srcVoice: { en: 'Voice', ta: 'குரல்' },
  scanDoc: { en: 'Scan {doc}', ta: '{doc} ஸ்கேன் செய்' },
  askByVoice: { en: 'Say it', ta: 'சொல்லுங்கள்' },
  readFromPhoto: { en: 'Read from photo — please confirm', ta: 'புகைப்படத்திலிருந்து படித்தது — உறுதிசெய்யவும்' },
  confirm: { en: 'Confirm', ta: 'உறுதிசெய்' },
  carry: { en: 'Carry', ta: 'எடுத்துச் செல்லவும்' },
  createForm: { en: 'Create form', ta: 'படிவத்தை உருவாக்கு' },
  finishFields: { en: 'Fill {n} more to continue', ta: 'தொடர இன்னும் {n} நிரப்பவும்' },
  confirmFields: { en: 'Confirm {n} scanned fields', ta: '{n} ஸ்கேன் விவரங்களை உறுதிசெய்யவும்' },

  scanTitle: { en: 'Scan your {doc}', ta: 'உங்கள் {doc} ஸ்கேன் செய்யவும்' },
  scanLead: {
    en: 'Take a clear photo in good light. We read the numbers and delete the photo right away.',
    ta: 'நல்ல வெளிச்சத்தில் தெளிவான புகைப்படம் எடுக்கவும். எண்களைப் படித்தவுடன் புகைப்படம் நீக்கப்படும்.',
  },
  takePhoto: { en: 'Take photo', ta: 'புகைப்படம் எடு' },
  useDemo: { en: 'Use demo values', ta: 'டெமோ மதிப்புகளைப் பயன்படுத்து' },
  reading: { en: 'Reading the document…', ta: 'ஆவணத்தைப் படிக்கிறது…' },
  photoDeleted: { en: 'Photo discarded after reading — never saved', ta: 'படித்த பின் புகைப்படம் அழிக்கப்பட்டது — சேமிக்கப்படவில்லை' },
  ocrNotFound: {
    en: "Couldn't read {what}. Try a sharper photo, or type it.",
    ta: '{what} படிக்க முடியவில்லை. தெளிவான புகைப்படம் எடுக்கவும், அல்லது தட்டச்சு செய்யவும்.',
  },
  ocrFailed: {
    en: "Couldn't read the photo. Check the internet connection and try again.",
    ta: 'புகைப்படத்தைப் படிக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
  },
  useTheseValues: { en: 'Use these values', ta: 'இந்த மதிப்புகளைப் பயன்படுத்து' },
  demoAdded: { en: 'Demo values added — please confirm each one', ta: 'டெமோ மதிப்புகள் சேர்க்கப்பட்டன — ஒவ்வொன்றையும் உறுதிசெய்யவும்' },

  formReady: { en: 'Your form is ready', ta: 'உங்கள் படிவம் தயார்' },
  formReadyLead: {
    en: 'Save it as PDF, then submit it at your nearest e-Sevai centre or on the official website.',
    ta: 'PDF ஆகச் சேமித்து, அருகிலுள்ள இ-சேவை மையத்தில் அல்லது அதிகாரப்பூர்வ இணையதளத்தில் சமர்ப்பிக்கவும்.',
  },
  savePdf: { en: 'Save as PDF', ta: 'PDF ஆகச் சேமி' },
  copyDetails: { en: 'Copy details', ta: 'விவரங்களை நகலெடு' },
  fillOfficial: { en: 'Fill Official Government Form', ta: 'அதிகாரப்பூர்வ அரசு படிவத்தை நிரப்பு' },
  portalLead: {
    en: 'GoScheme opens the official website and fills in your details. You type the captcha and OTP, check everything, then tap Continue.',
    ta: 'GoScheme அதிகாரப்பூர்வ இணையதளத்தைத் திறந்து உங்கள் விவரங்களை நிரப்பும். கேப்ட்சா, OTP-ஐ நீங்கள் உள்ளிட்டு, சரிபார்த்து "தொடர்" அழுத்தவும்.',
  },
  aadhaarFull: { en: 'Aadhaar number (12 digits)', ta: 'ஆதார் எண் (12 இலக்கம்)' },
  notSaved: { en: 'Used only to fill this form. Never saved on the phone.', ta: 'இந்தப் படிவத்தை நிரப்ப மட்டும். மொபைலில் சேமிக்கப்படாது.' },
  youDo: { en: 'You do', ta: 'நீங்கள் செய்ய வேண்டியது' },
  openPortal: { en: 'Open official website', ta: 'அதிகாரப்பூர்வ இணையதளத்தைத் திற' },
  webOnlyNote: {
    en: 'Automatic filling works in the GoScheme Android app. In a browser, the website opens in a new tab and you copy each detail.',
    ta: 'தானியங்கி நிரப்புதல் GoScheme ஆண்ட்ராய்டு செயலியில் மட்டும். உலாவியில், இணையதளம் புதிய தாவலில் திறக்கும்; ஒவ்வொரு விவரத்தையும் நகலெடுக்கவும்.',
  },
  copyEach: { en: 'The website opened in a new tab. Copy each detail into it:', ta: 'இணையதளம் புதிய தாவலில் திறந்தது. ஒவ்வொரு விவரத்தையும் நகலெடுத்து ஒட்டவும்:' },
  copy: { en: 'Copy', ta: 'நகலெடு' },
  demoPortal: { en: 'Try with demo data', ta: 'டெமோ தரவுடன் முயற்சிக்கவும்' },
  badAadhaar: { en: 'Enter the 12-digit Aadhaar number.', ta: '12 இலக்க ஆதார் எண்ணை உள்ளிடவும்.' },
  badMobile: { en: 'Enter the 10-digit mobile number.', ta: '10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.' },
  copied: { en: 'Copied — paste it into a note or message', ta: 'நகலெடுக்கப்பட்டது — குறிப்பு அல்லது செய்தியில் ஒட்டவும்' },
  formReadyLeadCopy: {
    en: 'Copy the details, then submit them at your nearest e-Sevai centre or on the official website.',
    ta: 'விவரங்களை நகலெடுத்து, அருகிலுள்ள இ-சேவை மையத்தில் அல்லது அதிகாரப்பூர்வ இணையதளத்தில் சமர்ப்பிக்கவும்.',
  },
  backToSchemes: { en: 'Back to schemes', ta: 'திட்டங்களுக்குத் திரும்பு' },
  noForms: { en: 'No forms yet', ta: 'இன்னும் படிவங்கள் இல்லை' },
  noFormsLead: {
    en: 'Open a scheme you are eligible for and tap "Fill the application".',
    ta: 'தகுதியுள்ள திட்டத்தைத் திறந்து "விண்ணப்பத்தை நிரப்பு" என்பதைத் தொடவும்.',
  },
  formReadyTag: { en: 'Form ready', ta: 'படிவம் தயார்' },
  statusTitle: { en: 'Application status', ta: 'விண்ணப்ப நிலை' },
  statusLead: { en: 'Update it after you submit, so GoScheme can remind you.', ta: 'சமர்ப்பித்த பின் புதுப்பிக்கவும்; GoScheme உங்களுக்கு நினைவூட்டும்.' },
  stSubmitted: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  stApproved: { en: 'Approved', ta: 'அங்கீகரிக்கப்பட்டது' },
  stRejected: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
  remindOn: { en: "We'll remind you to check the status on {date}.", ta: '{date} அன்று நிலையைச் சரிபார்க்க நினைவூட்டுவோம்.' },
  checkStatusDue: { en: 'Check the status of {n} submitted application(s) on the official website.', ta: 'சமர்ப்பித்த {n} விண்ணப்பங்களின் நிலையை அதிகாரப்பூர்வ இணையதளத்தில் சரிபார்க்கவும்.' },
  remindTitle: { en: 'Check your application', ta: 'உங்கள் விண்ணப்பத்தைச் சரிபார்க்கவும்' },
  remindBody: { en: '{scheme}: check the status on the official website.', ta: '{scheme}: அதிகாரப்பூர்வ இணையதளத்தில் நிலையைச் சரிபார்க்கவும்.' },
  rejectedLead: { en: 'Ask the office for the reason. You can usually fix it and apply again.', ta: 'காரணத்தை அலுவலகத்தில் கேளுங்கள். பொதுவாகச் சரிசெய்து மீண்டும் விண்ணப்பிக்கலாம்.' },

  familyTitle: { en: 'Your family', ta: 'உங்கள் குடும்பம்' },
  household: { en: 'Household', ta: 'குடும்ப விவரம்' },
  language: { en: 'Language', ta: 'மொழி' },
  deleteAll: { en: 'Delete all my data', ta: 'எனது எல்லா தரவையும் நீக்கு' },
  deleteConfirm: {
    en: 'This removes every profile and form from this phone. It cannot be undone.',
    ta: 'இந்த மொபைலிலிருந்து எல்லா சுயவிவரங்களும் படிவங்களும் நீக்கப்படும். இதைத் திரும்பப் பெற முடியாது.',
  },
  deleteYes: { en: 'Delete everything', ta: 'அனைத்தையும் நீக்கு' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  storedEncrypted: { en: 'Stored encrypted on this phone', ta: 'இந்த மொபைலில் மறைகுறியாக்கப்பட்டு சேமிக்கப்பட்டுள்ளது' },
  notStored: {
    en: 'Secure storage is unavailable here, so nothing is saved after you close the app.',
    ta: 'பாதுகாப்பான சேமிப்பு இங்கு இல்லை, எனவே செயலியை மூடியதும் எதுவும் சேமிக்கப்படாது.',
  },

  fName: { en: 'Name', ta: 'பெயர்' },
  fAge: { en: 'Age', ta: 'வயது' },
  fGender: { en: 'Gender', ta: 'பாலினம்' },
  fOccupation: { en: 'Work', ta: 'வேலை' },
  fIncome: { en: 'Family income', ta: 'குடும்ப வருமானம்' },
  fDistrict: { en: 'District', ta: 'மாவட்டம்' },
  fFamilySize: { en: 'Family size', ta: 'குடும்ப எண்ணிக்கை' },
  years: { en: '{n} years', ta: '{n} வயது' },
  people: { en: '{n} people', ta: '{n} பேர்' },
  perYear: { en: '₹{amount} a year', ta: 'ஆண்டுக்கு ₹{amount}' },
} satisfies Record<string, Text>

export type StrKey = keyof typeof STRINGS

export function translate(lang: Lang, key: StrKey, vars?: Record<string, string | number>): string {
  let out = pickText(STRINGS[key], lang)
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}

export const OCCUPATIONS: Record<Occupation, Text> = {
  farmer: { en: 'Farmer', ta: 'விவசாயி' },
  student: { en: 'Student', ta: 'மாணவர்' },
  daily_wage: { en: 'Daily-wage worker', ta: 'தினக்கூலி தொழிலாளி' },
  salaried: { en: 'Salaried job', ta: 'மாதச் சம்பள வேலை' },
  business: { en: 'Self-employed', ta: 'சுயதொழில்' },
  homemaker: { en: 'Homemaker', ta: 'இல்லத்தரசி' },
  unemployed: { en: 'Looking for work', ta: 'வேலை தேடுகிறேன்' },
  retired: { en: 'Retired', ta: 'ஓய்வு பெற்றவர்' },
}

export const GENDERS: Record<Gender, Text> = {
  male: { en: 'Male', ta: 'ஆண்' },
  female: { en: 'Female', ta: 'பெண்' },
  other: { en: 'Other', ta: 'மற்றவை' },
}

export const RELATIONS: Record<Relation, Text> = {
  self: { en: 'You', ta: 'நீங்கள்' },
  spouse: { en: 'Husband / Wife', ta: 'கணவர் / மனைவி' },
  child: { en: 'Son / Daughter', ta: 'மகன் / மகள்' },
  parent: { en: 'Father / Mother', ta: 'தந்தை / தாய்' },
  sibling: { en: 'Brother / Sister', ta: 'சகோதரர் / சகோதரி' },
  other: { en: 'Other relative', ta: 'பிற உறவினர்' },
}

/** Relation label that respects the member's gender, e.g. "Wife" instead of "Husband / Wife". */
export function relationLabel(relation: Relation, gender: Gender | undefined, lang: Lang): string {
  const g: Record<Exclude<Relation, 'self' | 'other'>, [Text, Text]> = {
    spouse: [{ en: 'Husband', ta: 'கணவர்' }, { en: 'Wife', ta: 'மனைவி' }],
    child: [{ en: 'Son', ta: 'மகன்' }, { en: 'Daughter', ta: 'மகள்' }],
    parent: [{ en: 'Father', ta: 'தந்தை' }, { en: 'Mother', ta: 'தாய்' }],
    sibling: [{ en: 'Brother', ta: 'சகோதரர்' }, { en: 'Sister', ta: 'சகோதரி' }],
  }
  if (relation === 'self' || relation === 'other' || !gender || gender === 'other') return pickText(RELATIONS[relation], lang)
  return pickText(g[relation][gender === 'female' ? 1 : 0], lang)
}

/** Indian digit grouping: 250000 → "2,50,000". */
export function inr(n: number): string {
  return Math.round(n).toLocaleString('en-IN')
}

const LAKH_WORD: Record<Lang, string> = { en: 'lakh', ta: 'லட்சம்', hi: 'लाख', te: 'లక్షలు', kn: 'ಲಕ್ಷ' }

export function formatIncome(n: number, lang: Lang): string {
  if (n >= 100000) {
    const l = +(n / 100000).toFixed(2)
    return `₹${l} ${LAKH_WORD[lang]}`
  }
  return `₹${inr(n)}`
}
