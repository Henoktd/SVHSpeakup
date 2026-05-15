import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type {
  PotentialImpact,
  PresidentialEscalationFactor,
  UrgencyLevel
} from "@svh/types";

export type Language = "en" | "am";

const languageStorageKey = "svh-speakup-language";

const translations = {
  en: {
    "nav.reporting": "Reporting channel",
    "nav.track": "Track case",
    "nav.privacy": "Privacy",
    "nav.home": "Home page",
    "nav.newReport": "New report",
    "language.english": "English",
    "language.amharic": "አማርኛ",
    "home.eyebrow": "SVH SpeakUp",
    "home.title": "Reporting channel",
    "home.lede":
      "Use this channel to safely report concerns, misconduct, or unethical behavior. It covers SVH and its ventures.",
    "home.startReport": "Start a report",
    "home.trackExisting": "Track existing case",
    "home.confidentiality": "How confidentiality works",
    "home.next.title": "What happens next",
    "home.next.item1": "Your report is submitted securely.",
    "home.next.item2": "You receive a case ID and secret.",
    "home.next.item3": "You can return later for follow-up.",
    "home.covered.title": "Covered entities",
    "home.covered.copy": "This channel covers SVH and 4 ventures.",
    "home.privacy.eyebrow": "Privacy",
    "home.privacy.title": "Keep your identity safe",
    "home.privacy.item1": "Do not include your name unless you want to share it.",
    "home.privacy.item2": "Keep your case ID and secret somewhere safe.",
    "home.privacy.item3": "Be as clear and factual as possible.",
    "report.eyebrow": "Anonymous submission",
    "report.title": "New report",
    "report.lede":
      "Submit a concern relating to SVH or one of its ventures. Your report is treated as confidential and can be followed up later with your case ID and secret.",
    "report.steps.aria": "Report submission steps",
    "report.step1.title": "Report details",
    "report.step1.copy": "Share what happened and where.",
    "report.step2.title": "Escalation & submit",
    "report.step2.copy": "Add urgency context and confirm submission.",
    "report.step1.eyebrow": "Step 1 of 2",
    "report.step1.heading": "Report details",
    "report.step1.help":
      "Start with the core facts so investigators can understand the concern before they review escalation context.",
    "report.category": "Category",
    "report.loadingCategories": "Loading categories...",
    "report.selectCategory": "Select a category",
    "report.titleField": "Title",
    "report.titlePlaceholder": "Short summary of the concern",
    "report.titleHint": "Minimum 5 characters.",
    "report.description": "Description",
    "report.descriptionPlaceholder":
      "Describe what happened as concisely as you can. Investigators can follow up later.",
    "report.descriptionHint": "Minimum 15 characters.",
    "report.when": "When did it happen?",
    "report.where": "Where did it happen?",
    "report.wherePlaceholder": "For example: Nairobi office",
    "report.people": "People involved",
    "report.peoplePlaceholder": "Optional names, roles, or descriptors",
    "report.evidenceNotes": "Evidence notes",
    "report.evidenceNotesPlaceholder":
      "Optional notes about files, screenshots, or witnesses",
    "report.evidenceFiles": "Evidence files",
    "report.evidenceHint": "Up to {count} files, 10 MB each.",
    "report.optionsEmpty": "No report categories are currently available from Dataverse.",
    "report.optionsError": "Unable to load report categories from Dataverse.",
    "report.continueCopy": "Continue to add escalation and urgency details.",
    "report.next": "Next step",
    "report.step2.eyebrow": "Step 2 of 2",
    "report.step2.heading": "Escalation, impact, and submit",
    "report.step2.help":
      "Clarify why this needs higher attention, then confirm the confidentiality and good-faith statements before sending.",
    "report.escalation.eyebrow": "Escalation",
    "report.escalation.heading": "Justification for Presidential Escalation",
    "report.raisedChannels": "Has this issue been raised through normal channels?",
    "report.selectYesNo": "Select yes or no",
    "report.yes": "Yes",
    "report.no": "No",
    "report.localAction": "If yes, what action was taken or not taken?",
    "report.localActionPlaceholder": "Summarize what happened after raising it locally.",
    "report.escalationReason": "Why should this be escalated directly to the President?",
    "report.impact.eyebrow": "Impact",
    "report.impact.heading": "Impact & Urgency",
    "report.potentialImpact": "Potential impact if not addressed",
    "report.selectImpact": "Select impact level",
    "report.urgency": "Urgency",
    "report.selectUrgency": "Select urgency",
    "report.confidentiality.heading": "Confidentiality note",
    "report.confidentiality.copy":
      "Avoid sharing details that would reveal your identity unless you want investigators to have that information.",
    "report.confidentiality.accept": "I understand how confidentiality works in this portal.",
    "report.consent.accept": "I confirm that this report is submitted in good faith.",
    "report.back": "Back",
    "report.submitting": "Submitting...",
    "report.submit": "Submit report",
    "report.submitError": "Unable to submit report.",
    "report.evidenceTooMany": "Upload up to {count} evidence files.",
    "report.evidenceTooLarge": "Each evidence file must be 10 MB or smaller.",
    "confirmation.eyebrow": "Report received",
    "confirmation.title": "Your case has been created.",
    "confirmation.lede":
      "Keep these details somewhere safe. They are the only way to access your anonymous case later.",
    "confirmation.caseId": "Case ID",
    "confirmation.secret": "Secret",
    "confirmation.submittedAt": "Submitted at",
    "confirmation.emailTitle": "Receive updates about your report by email",
    "confirmation.emailDescription":
      "Add an email if you want your case details sent to you for follow-up later.",
    "confirmation.missing":
      "No submission details were found in this session. Once the backend is connected, this page should be reached from a successful form submission.",
    "confirmation.track": "Track this case",
    "confirmation.submitAnother": "Submit another report",
    "confirmation.home": "Return home",
    "track.eyebrow": "Secure follow-up",
    "track.title": "Track an existing case",
    "track.lede":
      "Enter the case ID and secret you received after submitting your report. This view stays anonymous and only exposes your case data.",
    "track.caseId": "Case ID",
    "track.secret": "Secret",
    "track.opening": "Opening case...",
    "track.access": "Access case",
    "track.error": "Unable to access the case.",
    "track.badgeCase": "Case: {caseId}",
    "track.submissionTracking": "Submission tracking",
    "track.workflowCopy":
      "Your report is recorded in the SVH SpeakUp workflow. Activity appears below as investigators update the case.",
    "track.summary": "Case summary",
    "track.category": "Category",
    "track.submitted": "Submitted",
    "track.lastActivity": "Last activity",
    "track.emailUpdates": "Email updates",
    "track.notAdded": "Not added yet",
    "track.emailTitle": "Add or update your follow-up email",
    "track.emailDescription":
      "Use the same secure case credentials to add or update the email address used for follow-up.",
    "track.notProvided": "Not provided",
    "track.incidentDate": "Incident date",
    "track.location": "Location",
    "track.people": "People involved",
    "track.evidence": "Evidence notes",
    "track.escalationContext": "Presidential escalation context",
    "track.raisedChannels": "Raised through normal channels",
    "track.potentialImpact": "Potential impact",
    "track.urgency": "Urgency",
    "track.localAction": "Local action summary",
    "track.otherDetail": "Other escalation detail",
    "track.updatesEyebrow": "Secure updates",
    "track.timeline": "Activity timeline",
    "track.protected": "End-to-end protected",
    "track.note":
      "Messaging can be added next once the Dataverse message table is enabled. This view is already wired to the live case and audit records.",
    "email.placeholder": "name@example.com",
    "email.saving": "Saving...",
    "email.update": "Update email",
    "email.save": "Save email",
    "email.error": "Unable to save email.",
    "email.ethereal": "Your case details were sent to a local test inbox.",
    "email.openPreview": "Open email preview",
    "email.sent": "Your case details were emailed to this address.",
    "email.notConfigured": "Your email was saved, but email delivery is not configured yet.",
    "progress.received.label": "Received",
    "progress.received.description": "Your submission has been recorded.",
    "progress.investigation.label": "Investigation",
    "progress.investigation.description": "The case is currently under review.",
    "progress.action.label": "Action taken",
    "progress.action.description": "A final action or resolution has been recorded.",
    "actor.reporter": "Reporter activity",
    "actor.investigator": "Investigator activity",
    "common.yes": "Yes",
    "common.no": "No"
  },
  am: {
    "nav.reporting": "ሪፖርት ማድረጊያ መድረክ",
    "nav.track": "ጉዳይን ይከታተሉ",
    "nav.privacy": "ግላዊነት",
    "nav.home": "መነሻ",
    "nav.newReport": "አዲስ ሪፖርት",
    "language.english": "English",
    "language.amharic": "አማርኛ",
    "home.eyebrow": "SVH SpeakUp",
    "home.title": "ሪፖርት ማድረጊያ መድረክ",
    "home.lede":
      "ይህንን መድረክ ስጋቶችን፣ የአሰራር ግድፈቶችን ወይም ኢ-ሥነምግባራዊ ድርጊቶችን በደህንነት ሪፖርት ለማድረግ ይጠቀሙ።",
    "home.startReport": "ሪፖርት ይጀምሩ",
    "home.trackExisting": "ነባር ጉዳይ ተከታተል",
    "home.confidentiality": "ሚስጥራዊነት እንዴት እንደሚጠበቅ",
    "home.next.title": "ቀጥሎ ምን ይሆናል",
    "home.next.item1": "ሪፖርትዎ በደህና ይላካል።",
    "home.next.item2": "የጉዳይ መለያ ቁጥር (case ID) እና የጥበቃ ኮድ ይሰጥዎታል።",
    "home.next.item3": "በኋላ ለክትትል መመለስ ይችላሉ።",
    "home.covered.title": "የሚሸፈኑ ተቋማት",
    "home.covered.copy": "ይህ መስመር SVHን እና 4 ተቋማትን ይሸፍናል።",
    "home.privacy.eyebrow": "ግላዊነት",
    "home.privacy.title": "ማንነትዎን ይጠብቁ",
    "home.privacy.item1": "ማንነትዎን ማጋራት ካልፈለጉ ስምዎን አያካትቱ።",
    "home.privacy.item2": "የጉዳይ መለያዎን እና ሚስጥሩን በደህና ያስቀምጡ።",
    "home.privacy.item3": "በተቻለ መጠን ግልጽ እና በእውነታ ላይ የተመሰረተ መረጃ ይስጡ።",
    "report.eyebrow": "ማንነት የማይገልጽ ሪፖርት",
    "report.title": "አዲስ ሪፖርት",
    "report.lede":
      "ከSVH ወይም ከተቋማቱ ጋር የተያያዘ ስጋት ያስገቡ። ሪፖርትዎ በሚስጥር ይያዛል፣ እና በጉዳይ መለያዎ እና በሚስጥሩ በኋላ መከታተል ይችላሉ።",
    "report.steps.aria": "የሪፖርት ማስገቢያ ደረጃዎች",
    "report.step1.title": "የሪፖርት ዝርዝሮች",
    "report.step1.copy": "የተከሰተውን እና የት እንደተከሰተ ያካፍሉ።",
    "report.step2.title": "ማሳደግ እና ማስገባት",
    "report.step2.copy": "የአስቸኳይነት አውድ ያክሉ እና ማስገባቱን ያረጋግጡ።",
    "report.step1.eyebrow": "ደረጃ 1 ከ 2",
    "report.step1.heading": "የሪፖርቱ ዝርዝር",
    "report.step1.help":
      "አጣሪዎች ጉዳዩን ከማሳደግ አውድ በፊት እንዲረዱ ዋና እውነታዎችን ይጀምሩ።",
    "report.category": "ምድብ",
    "report.loadingCategories": "ምድቦች በመጫን ላይ...",
    "report.selectCategory": "ምድብ ይምረጡ",
    "report.titleField": "ርዕስ",
    "report.titlePlaceholder": "የስጋቱ አጭር ማጠቃለያ",
    "report.titleHint": "ቢያንስ 5 ፊደላት።",
    "report.description": "ዝርዝር መግለጫ",
    "report.descriptionPlaceholder":
      "የተከሰተውን በተቻለ መጠን በግልጽ ይግለጹ። አጣሪዎች በኋላ መከታተል ይችላሉ።",
    "report.descriptionHint": "ቢያንስ 15 ፊደላት።",
    "report.when": "መቼ ተከሰተ?",
    "report.where": "የት ተከሰተ?",
    "report.wherePlaceholder": "ለምሳሌ፦ የናይሮቢ ቢሮ",
    "report.people": "የተሳተፉ ሰዎች",
    "report.peoplePlaceholder": "አማራጭ ስሞች፣ ሚናዎች ወይም መግለጫዎች",
    "report.evidenceNotes": "የማስረጃ ማስታወሻዎች",
    "report.evidenceNotesPlaceholder": "ስለ ፋይሎች፣ ምስሎች ወይም ምስክሮች አማራጭ ማስታወሻ",
    "report.evidenceFiles": "የማስረጃ ፋይሎች",
    "report.evidenceHint": "እስከ {count} ፋይሎች፣ እያንዳንዱ እስከ 10 MB።",
    "report.optionsEmpty": "ከDataverse ምንም የሪፖርት ምድቦች አልተገኙም።",
    "report.optionsError": "ከDataverse የሪፖርት ምድቦችን መጫን አልተቻለም።",
    "report.continueCopy": "የማሳደግ እና የአስቸኳይነት ዝርዝሮችን ለመጨመር ይቀጥሉ።",
    "report.next": "ቀጣይ ደረጃ",
    "report.step2.eyebrow": "ደረጃ 2 ከ 2",
    "report.step2.heading": "ማሳደግ፣ ተጽዕኖ እና ማስገባት",
    "report.step2.help":
      "ጉዳዩ ለምን ከፍ ያለ ትኩረት እንደሚፈልግ ያብራሩ፣ ከዚያም የሚስጥራዊነት እና የቅን እምነት መግለጫዎችን ያረጋግጡ።",
    "report.escalation.eyebrow": "ማሳደግ",
    "report.escalation.heading": "ጉዳዩ በቀጥታ ለፕሬዝዳንቱ እንዲቀርብ የተፈለገበት ምክንያት",
    "report.raisedChannels": "ይህ ጉዳይ በመደበኛ የአሰራር መድረኮች ቀርቧል?",
    "report.selectYesNo": "አዎ ወይም አይ ይምረጡ",
    "report.yes": "አዎ",
    "report.no": "አይ",
    "report.localAction": "አዎ ከሆነ፣ ምን እርምጃ ተወሰደ ወይም አልተወሰደም?",
    "report.localActionPlaceholder": "በአካባቢው ካነሱት በኋላ የተከሰተውን ያጠቃልሉ።",
    "report.escalationReason": "ይህ ጉዳይ በቀጥታ ወደ ፕሬዚዳንት ለምን መላክ አለበት?",
    "report.impact.eyebrow": "ተጽዕኖ",
    "report.impact.heading": "ተጽዕኖ እና አስቸኳይነት",
    "report.potentialImpact": "ካልተፈታ ሊኖረው የሚችለው ተጽዕኖ",
    "report.selectImpact": "የተጽዕኖ ደረጃ ይምረጡ",
    "report.urgency": "አስቸኳይነት",
    "report.selectUrgency": "አስቸኳይነት ይምረጡ",
    "report.confidentiality.heading": "የሚስጥራዊነት ማስታወሻ",
    "report.confidentiality.copy":
      "አጣሪዎች ያንን መረጃ እንዲኖራቸው ካልፈለጉ ማንነትዎን ሊገልጹ የሚችሉ ዝርዝሮችን አያጋሩ።",
    "report.confidentiality.accept": "በዚህ መድረክ ውስጥ ምስጢራዊነት እንዴት እንደሚጠበቅ ተረድቻለሁ።",
    "report.consent.accept": "ይህ ሪፖርት በቅን ልቦና የቀረበ መሆኑን አረጋግጣለሁ።",
    "report.back": "ተመለስ",
    "report.submitting": "በመላክ ላይ...",
    "report.submit": "ሪፖርት ላክ",
    "report.submitError": "ሪፖርት ማስገባት አልተቻለም።",
    "report.evidenceTooMany": "እስከ {count} የማስረጃ ፋይሎች ይስቀሉ።",
    "report.evidenceTooLarge": "እያንዳንዱ የማስረጃ ፋይል 10 MB ወይም ከዚያ በታች መሆን አለበት።",
    "confirmation.eyebrow": "ሪፖርቱ ተቀብሏል",
    "confirmation.title": "ጉዳይዎ ተፈጥሯል።",
    "confirmation.lede": "እነዚህን ዝርዝሮች በደህና ያስቀምጡ። በኋላ ማንነት የማይገልጽ ጉዳይዎን ለመድረስ እነሱ ብቻ ያስፈልጋሉ።",
    "confirmation.caseId": "የጉዳይ መለያ ቁጥር",
    "confirmation.secret": "የጥበቃ ኮድ",
    "confirmation.submittedAt": "የተላከበት ጊዜ",
    "confirmation.emailTitle": "ስለ ሪፖርትዎ በኢሜይል ዝርዝሮችን ይቀበሉ",
    "confirmation.emailDescription": "የጉዳይ ዝርዝሮችዎ ለክትትል በኢሜይል እንዲላኩልዎ ከፈለጉ ኢሜይል ያክሉ።",
    "confirmation.missing": "በዚህ ክፍለ ጊዜ የማስገቢያ ዝርዝሮች አልተገኙም። ባክኤንዱ ከተገናኘ በኋላ ይህ ገጽ ከተሳካ የቅጽ ማስገቢያ ሊደረስበት ይገባል።",
    "confirmation.track": "ይህን ጉዳይ ተከታተል",
    "confirmation.submitAnother": "ሌላ ሪፖርት ላክ",
    "confirmation.home": "ወደ መነሻ ተመለስ",
    "track.eyebrow": "ደህንነቱ የተጠበቀ ክትትል",
    "track.title": "ያለውን ጉዳይ ይከታተሉ",
    "track.lede": "ሪፖርትዎን ካስገቡ በኋላ የተቀበሉትን የጉዳይ መለያ እና ሚስጥር ያስገቡ። ይህ እይታ ማንነትዎን አይገልጽም።",
    "track.caseId": "የጉዳይ መለያ",
    "track.secret": "ሚስጥር",
    "track.opening": "ጉዳዩ በመከፈት ላይ...",
    "track.access": "ጉዳይ ክፈት",
    "track.error": "ጉዳዩን መድረስ አልተቻለም።",
    "track.badgeCase": "ጉዳይ፦ {caseId}",
    "track.submissionTracking": "የማስገቢያ ክትትል",
    "track.workflowCopy": "ሪፖርትዎ በSVH SpeakUp የስራ ሂደት ውስጥ ተመዝግቧል። አጣሪዎች ጉዳዩን ሲያዘምኑ እንቅስቃሴዎች ከታች ይታያሉ።",
    "track.summary": "የጉዳይ ማጠቃለያ",
    "track.category": "ምድብ",
    "track.submitted": "የተላከበት",
    "track.lastActivity": "የመጨረሻ እንቅስቃሴ",
    "track.emailUpdates": "የኢሜይል ክትትሎች",
    "track.notAdded": "እስካሁን አልታከለም",
    "track.emailTitle": "የክትትል ኢሜይልዎን ያክሉ ወይም ያዘምኑ",
    "track.emailDescription": "ለክትትል የሚጠቀሙበትን ኢሜይል ለማከል ወይም ለማዘመን ያንኑ የጉዳይ መለያ እና ሚስጥር ይጠቀሙ።",
    "track.notProvided": "አልቀረበም",
    "track.incidentDate": "የክስተት ቀን",
    "track.location": "ቦታ",
    "track.people": "የተሳተፉ ሰዎች",
    "track.evidence": "የማስረጃ ማስታወሻዎች",
    "track.escalationContext": "የፕሬዚዳንት ማሳደግ አውድ",
    "track.raisedChannels": "በመደበኛ መስመሮች ተነስቷል",
    "track.potentialImpact": "ሊኖር የሚችል ተጽዕኖ",
    "track.urgency": "አስቸኳይነት",
    "track.localAction": "የአካባቢ እርምጃ ማጠቃለያ",
    "track.otherDetail": "ሌላ የማሳደግ ዝርዝር",
    "track.updatesEyebrow": "ደህንነቱ የተጠበቀ ዝማኔ",
    "track.timeline": "የእንቅስቃሴ መስመር",
    "track.protected": "ከመጨረሻ እስከ መጨረሻ የተጠበቀ",
    "track.note": "የDataverse መልዕክት ሰንጠረዥ ከነቃ በኋላ መልዕክት መላክ ሊጨመር ይችላል። ይህ እይታ ከቀጥታ ጉዳይ እና ኦዲት መዝገቦች ጋር ተያይዟል።",
    "email.placeholder": "name@example.com",
    "email.saving": "በማስቀመጥ ላይ...",
    "email.update": "ኢሜይል አዘምን",
    "email.save": "ኢሜይል አስቀምጥ",
    "email.error": "ኢሜይል ማስቀመጥ አልተቻለም።",
    "email.ethereal": "የጉዳይ ዝርዝሮችዎ ወደ የአካባቢ ሙከራ መልዕክት ሳጥን ተልከዋል።",
    "email.openPreview": "የኢሜይል ቅድመ እይታ ክፈት",
    "email.sent": "የጉዳይ ዝርዝሮችዎ ወደዚህ ኢሜይል ተልከዋል።",
    "email.notConfigured": "ኢሜይልዎ ተቀምጧል፣ ግን የኢሜይል መላክ ገና አልተዋቀረም።",
    "progress.received.label": "ተቀብሏል",
    "progress.received.description": "ማስገቢያዎ ተመዝግቧል።",
    "progress.investigation.label": "ምርመራ",
    "progress.investigation.description": "ጉዳዩ በአሁኑ ጊዜ በግምገማ ላይ ነው።",
    "progress.action.label": "እርምጃ ተወስዷል",
    "progress.action.description": "የመጨረሻ እርምጃ ወይም መፍትሄ ተመዝግቧል።",
    "actor.reporter": "የሪፖርተር እንቅስቃሴ",
    "actor.investigator": "የአጣሪ እንቅስቃሴ",
    "common.yes": "አዎ",
    "common.no": "አይ"
  }
} as const;

type TranslationKey = keyof typeof translations.en;

const categoryLabelTranslations: Record<string, string> = {
  "fraud": "ማጭበርበር",
  "corruption": "ሙስና",
  "misconduct": "ብልሹ አሰራር",
  "other": "ሌላ",
  "harassment": "ትንኮሳ",
  "fraud, theft & financial misconduct": "ማጭበርበር፣ ስርቆት እና የገንዘብ ብልሹ አሰራር",
  "harassment, bullying & workplace misconduct": "ትንኮሳ፣ ጉልበተኝነት እና የስራ ቦታ ብልሹ አሰራር",
  "discrimination & human rights concerns": "መድልዎ እና የሰብአዊ መብት ጉዳዮች",
  "health, safety & environmental concerns": "የጤና፣ ደህንነት እና አካባቢ ጉዳዮች",
  "legal, regulatory & policy violations": "የሕግ፣ የቁጥጥር እና የፖሊሲ ጥሰቶች",
  "procurement, vendor & ethics issues": "የግዢ፣ የአቅራቢ እና የሥነ-ምግባር ጉዳዮች",
  "it, cybersecurity & data misuse": "የIT፣ የሳይበር ደህንነት እና የመረጃ አላግባብ አጠቃቀም",
  "consumer, client & product concerns": "የተጠቃሚ፣ የደንበኛ እና የምርት ጉዳዮች",
  "damage to company assets or reputation": "በኩባንያ ንብረት ወይም ስም ላይ የሚደርስ ጉዳት",
  "other ethical concerns": "ሌሎች የሥነ-ምግባር ጉዳዮች"
};

const escalationFactorTranslations: Record<PresidentialEscalationFactor, string> = {
  involving_ceo_or_senior_leadership: "የCEO ወይም ከፍተኛ አመራር ተሳትፎ",
  conflict_of_interest_at_leadership_level: "በአመራር ደረጃ የጥቅም ግጭት",
  fear_of_retaliation: "የአጸፋ እርምጃ ፍርሃት",
  issue_was_ignored_or_mishandled_locally: "ጉዳዩ በአካባቢው ተዘንግቷል ወይም በስህተት ተይዟል",
  significant_risk_level_on_venture: "በተቋሙ ላይ ከፍተኛ የአደጋ ደረጃ",
  cross_venture_impact: "በብዙ ተቋማት ላይ ተጽዕኖ",
  other: "ሌላ"
};

const escalationFactorEnglishLabels: Record<PresidentialEscalationFactor, string> = {
  involving_ceo_or_senior_leadership: "Involving CEO or senior leadership",
  conflict_of_interest_at_leadership_level:
    "Conflict of interest at leadership level",
  fear_of_retaliation: "Fear of retaliation",
  issue_was_ignored_or_mishandled_locally:
    "Issue was ignored or mishandled locally",
  significant_risk_level_on_venture: "Significant risk level on venture",
  cross_venture_impact: "Cross-venture impact",
  other: "Other"
};

const potentialImpactTranslations: Record<PotentialImpact, string> = {
  low: "ዝቅተኛ",
  medium: "መካከለኛ",
  high: "ከፍተኛ"
};

const urgencyTranslations: Record<UrgencyLevel, string> = {
  immediate_24_hrs: "አስቸኳይ (በ24 ሰዓታት ውስጥ)",
  high_few_days: "ከፍተኛ (በጥቂት ቀናት)",
  moderate: "መካከለኛ",
  low: "ዝቅተኛ"
};

const errorTranslations: Record<string, string> = {
  "Enter a title with at least 5 characters.": "እባክዎ ቢያንስ 5 ፊደላት ያለው ርዕስ ያስገቡ።",
  "Enter a description with at least 15 characters.": "ቢያንስ 15 ፊደላት ያለው መግለጫ ያስገቡ።",
  "Select whether the issue has already been raised through normal channels.":
    "ጉዳዩ በመደበኛ መስመሮች ተነስቶ እንደሆነ ይምረጡ።",
  "Select at least one reason for presidential escalation.":
    "ወደ ፕሬዚዳንት ለማሳደግ ቢያንስ አንድ ምክንያት ይምረጡ።",
  "Select the potential impact if the issue is not addressed.":
    "ጉዳዩ ካልተፈታ ሊኖረው የሚችለውን ተጽዕኖ ይምረጡ።",
  "Select the urgency for this issue.": "የዚህን ጉዳይ አስቸኳይነት ይምረጡ።",
  "You need to acknowledge the confidentiality notice.":
    "የሚስጥራዊነት ማስታወሻውን መቀበል አለብዎት።",
  "You need to confirm the report is submitted in good faith.":
    "ሪፖርቱ በቅን እምነት መቅረቡን ማረጋገጥ አለብዎት።",
  "Summarize what action was taken or not taken.":
    "ምን እርምጃ እንደተወሰደ ወይም እንዳልተወሰደ ያጠቃልሉ።"
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, variables?: Record<string, string | number>) => string;
  translateCategoryLabel: (label: string) => string;
  translateEscalationFactor: (factor: PresidentialEscalationFactor) => string;
  translatePotentialImpact: (impact: PotentialImpact) => string;
  translateUrgency: (urgency: UrgencyLevel) => string;
  translateError: (message?: string) => string | undefined;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  return window.localStorage.getItem(languageStorageKey) === "am" ? "am" : "en";
}

function interpolate(
  template: string,
  variables: Record<string, string | number> = {}
) {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === "am" ? "am" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    function t(
      key: TranslationKey,
      variables?: Record<string, string | number>
    ) {
      return interpolate(translations[language][key] ?? translations.en[key], variables);
    }

    return {
      language,
      setLanguage: setLanguageState,
      t,
      translateCategoryLabel(label: string) {
        if (language === "en") {
          return label;
        }

        return categoryLabelTranslations[normalizeLabel(label)] ?? label;
      },
      translateEscalationFactor(factor: PresidentialEscalationFactor) {
        return language === "am"
          ? escalationFactorTranslations[factor]
          : escalationFactorEnglishLabels[factor];
      },
      translatePotentialImpact(impact: PotentialImpact) {
        if (language === "am") {
          return potentialImpactTranslations[impact];
        }

        return {
          low: "Low",
          medium: "Medium",
          high: "High"
        }[impact];
      },
      translateUrgency(urgency: UrgencyLevel) {
        if (language === "am") {
          return urgencyTranslations[urgency];
        }

        return {
          immediate_24_hrs: "Immediate (24 hrs)",
          high_few_days: "High (few days)",
          moderate: "Moderate",
          low: "Low"
        }[urgency];
      },
      translateError(message?: string) {
        if (!message || language === "en") {
          return message;
        }

        return errorTranslations[message] ?? message;
      }
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
