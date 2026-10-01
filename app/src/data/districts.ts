/**
 * The 38 districts of Tamil Nadu: names in each app language, and common spoken aliases
 * (in any script) that the voice answer may contain.
 */
export type District = { en: string; ta: string; hi: string; te: string; kn: string; aliases: string[] }

export const DISTRICTS: District[] = [
  { en: 'Ariyalur', ta: 'அரியலூர்', hi: 'अरियलूर', te: 'అరియలూర్', kn: 'ಅರಿಯಲೂರು', aliases: [] },
  { en: 'Chengalpattu', ta: 'செங்கல்பட்டு', hi: 'चेंगलपट्टू', te: 'చెంగల్పట్టు', kn: 'ಚೆಂಗಲ್ಪಟ್ಟು', aliases: ['chengalpet', 'चेंगलपट्टु', 'చెంగల్పేట్'] },
  { en: 'Chennai', ta: 'சென்னை', hi: 'चेन्नई', te: 'చెన్నై', kn: 'ಚೆನ್ನೈ', aliases: ['madras', 'मद्रास', 'మద్రాస్', 'ಮದ್ರಾಸ್', 'चेन्नै'] },
  { en: 'Coimbatore', ta: 'கோயம்புத்தூர்', hi: 'कोयंबटूर', te: 'కోయంబత్తూరు', kn: 'ಕೊಯಮತ್ತೂರು', aliases: ['kovai', 'கோவை', 'कोयम्बटूर', 'कोयंबतूर', 'కోయంబత్తూర్', 'ಕೊಯಂಬತ್ತೂರು'] },
  { en: 'Cuddalore', ta: 'கடலூர்', hi: 'कडलूर', te: 'కడలూరు', kn: 'ಕಡಲೂರು', aliases: ['कुड्डालोर', 'కడలూర్'] },
  { en: 'Dharmapuri', ta: 'தருமபுரி', hi: 'धर्मपुरी', te: 'ధర్మపురి', kn: 'ಧರ್ಮಪುರಿ', aliases: ['தர்மபுரி'] },
  { en: 'Dindigul', ta: 'திண்டுக்கல்', hi: 'डिंडीगुल', te: 'దిండిగల్', kn: 'ದಿಂಡಿಗಲ್', aliases: ['डिंडिगुल'] },
  { en: 'Erode', ta: 'ஈரோடு', hi: 'इरोड', te: 'ఈరోడ్', kn: 'ಈರೋಡ್', aliases: ['ईरोड', 'ఈరోడు', 'ಈರೋಡು'] },
  { en: 'Kallakurichi', ta: 'கள்ளக்குறிச்சி', hi: 'कल्लाकुरिची', te: 'కళ్లకురిచ్చి', kn: 'ಕಳ್ಳಕುರಿಚ್ಚಿ', aliases: ['कल्लकुरिच्चि'] },
  { en: 'Kanchipuram', ta: 'காஞ்சிபுரம்', hi: 'कांचीपुरम', te: 'కాంచీపురం', kn: 'ಕಾಂಚೀಪುರಂ', aliases: ['kanchi', 'காஞ்சி', 'कांची', 'కాంచీ', 'ಕಾಂಚಿ'] },
  { en: 'Kanniyakumari', ta: 'கன்னியாகுமரி', hi: 'कन्याकुमारी', te: 'కన్యాకుమారి', kn: 'ಕನ್ಯಾಕುಮಾರಿ', aliases: ['kanyakumari', 'nagercoil', 'நாகர்கோவில்', 'नागरकोइल', 'నాగర్‌కోయిల్'] },
  { en: 'Karur', ta: 'கரூர்', hi: 'करूर', te: 'కరూర్', kn: 'ಕರೂರು', aliases: ['కరూరు', 'ಕರೂರ್'] },
  { en: 'Krishnagiri', ta: 'கிருஷ்ணகிரி', hi: 'कृष्णगिरी', te: 'కృష్ణగిరి', kn: 'ಕೃಷ್ಣಗಿರಿ', aliases: ['कृष्णगिरि', 'hosur', 'ஓசூர்', 'होसुर', 'హోసూర్', 'ಹೊಸೂರು'] },
  { en: 'Madurai', ta: 'மதுரை', hi: 'मदुरै', te: 'మదురై', kn: 'ಮಧುರೈ', aliases: ['मदुरई', 'ಮದುರೈ'] },
  { en: 'Mayiladuthurai', ta: 'மயிலாடுதுறை', hi: 'मयिलादुथुरै', te: 'మయిలాడుతురై', kn: 'ಮಯಿಲಾಡುತುರೈ', aliases: ['mayavaram'] },
  { en: 'Nagapattinam', ta: 'நாகப்பட்டினம்', hi: 'नागपट्टिनम', te: 'నాగపట్టినం', kn: 'ನಾಗಪಟ್ಟಿಣಂ', aliases: ['nagai', 'நாகை'] },
  { en: 'Namakkal', ta: 'நாமக்கல்', hi: 'नामक्कल', te: 'నామక్కల్', kn: 'ನಾಮಕ್ಕಲ್', aliases: [] },
  { en: 'Nilgiris', ta: 'நீலகிரி', hi: 'नीलगिरि', te: 'నీలగిరి', kn: 'ನೀಲಗಿರಿ', aliases: ['ooty', 'udhagamandalam', 'ஊட்டி', 'the nilgiris', 'ऊटी', 'नीलगिरी', 'ఊటీ', 'ಊಟಿ'] },
  { en: 'Perambalur', ta: 'பெரம்பலூர்', hi: 'पेरम्बलूर', te: 'పెరంబలూర్', kn: 'ಪೆರಂಬಲೂರು', aliases: ['पेरंबलूर'] },
  { en: 'Pudukkottai', ta: 'புதுக்கோட்டை', hi: 'पुदुक्कोट्टई', te: 'పుదుక్కోట్టై', kn: 'ಪುದುಕ್ಕೋಟ್ಟೈ', aliases: ['pudukottai'] },
  { en: 'Ramanathapuram', ta: 'இராமநாதபுரம்', hi: 'रामनाथपुरम', te: 'రామనాథపురం', kn: 'ರಾಮನಾಥಪುರಂ', aliases: ['ramnad', 'ராமநாதபுரம்', 'rameswaram', 'ராமேஸ்வரம்', 'रामेश्वरम', 'రామేశ్వరం', 'ರಾಮೇಶ್ವರಂ'] },
  { en: 'Ranipet', ta: 'இராணிப்பேட்டை', hi: 'रानीपेट', te: 'రాణిపేట', kn: 'ರಾಣಿಪೇಟೆ', aliases: ['ராணிப்பேட்டை'] },
  { en: 'Salem', ta: 'சேலம்', hi: 'सेलम', te: 'సేలం', kn: 'ಸೇಲಂ', aliases: [] },
  { en: 'Sivaganga', ta: 'சிவகங்கை', hi: 'शिवगंगा', te: 'శివగంగ', kn: 'ಶಿವಗಂಗಾ', aliases: ['sivagangai', 'सिवगंगा', 'ಶಿವಗಂಗೆ'] },
  { en: 'Tenkasi', ta: 'தென்காசி', hi: 'तेनकासी', te: 'తెన్‌కాశి', kn: 'ತೆಂಕಾಸಿ', aliases: ['तेंकासी', 'తెంకాసి'] },
  { en: 'Thanjavur', ta: 'தஞ்சாவூர்', hi: 'तंजावुर', te: 'తంజావూరు', kn: 'ತಂಜಾವೂರು', aliases: ['tanjore', 'தஞ்சை', 'तंजौर', 'तंजावूर', 'తంజావూర్'] },
  { en: 'Theni', ta: 'தேனி', hi: 'थेनी', te: 'తేని', kn: 'ತೇಣಿ', aliases: ['तेनी', 'ತೇನಿ'] },
  { en: 'Thoothukudi', ta: 'தூத்துக்குடி', hi: 'तूतीकोरिन', te: 'తూత్తుకుడి', kn: 'ತೂತ್ತುಕುಡಿ', aliases: ['tuticorin', 'थूथुकुडी', 'तूतुकुडी', 'టుటికోరిన్', 'ಟ್ಯುಟಿಕೋರಿನ್'] },
  { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி', hi: 'तिरुचिरापल्ली', te: 'తిరుచిరాపల్లి', kn: 'ತಿರುಚಿರಾಪಳ್ಳಿ', aliases: ['trichy', 'tiruchi', 'திருச்சி', 'त्रिची', 'तिरुची', 'ట్రిచీ', 'తిరుచ్చి', 'ತ್ರಿಚಿ', 'ತಿರುಚ್ಚಿ'] },
  { en: 'Tirunelveli', ta: 'திருநெல்வேலி', hi: 'तिरुनेलवेली', te: 'తిరునెల్వేలి', kn: 'ತಿರುನೆಲ್ವೇಲಿ', aliases: ['nellai', 'நெல்லை'] },
  { en: 'Tirupathur', ta: 'திருப்பத்தூர்', hi: 'तिरुपत्तूर', te: 'తిరుపత్తూరు', kn: 'ತಿರುಪತ್ತೂರು', aliases: ['tirupattur', 'తిరుపత్తూర్'] },
  { en: 'Tiruppur', ta: 'திருப்பூர்', hi: 'तिरुप्पुर', te: 'తిరుప్పూర్', kn: 'ತಿರುಪ್ಪೂರು', aliases: ['tirupur', 'तिरुपुर', 'తిరుపూర్'] },
  { en: 'Tiruvallur', ta: 'திருவள்ளூர்', hi: 'तिरुवल्लूर', te: 'తిరువళ్లూరు', kn: 'ತಿರುವಳ್ಳೂರು', aliases: ['thiruvallur', 'తిరువళ్ళూరు'] },
  { en: 'Tiruvannamalai', ta: 'திருவண்ணாமலை', hi: 'तिरुवन्नामलई', te: 'తిరువణ్ణామలై', kn: 'ತಿರುವಣ್ಣಾಮಲೈ', aliases: ['thiruvannamalai', 'अरुणाचलम', 'అరుణాచలం'] },
  { en: 'Tiruvarur', ta: 'திருவாரூர்', hi: 'तिरुवारूर', te: 'తిరువారూరు', kn: 'ತಿರುವಾರೂರು', aliases: ['thiruvarur'] },
  { en: 'Vellore', ta: 'வேலூர்', hi: 'वेल्लोर', te: 'వెల్లూరు', kn: 'ವೆಲ್ಲೂರು', aliases: ['वेल्लूर', 'వేలూరు', 'ವೇಲೂರು'] },
  { en: 'Viluppuram', ta: 'விழுப்புரம்', hi: 'विलुप्पुरम', te: 'విల్లుపురం', kn: 'ವಿಳುಪ್ಪುರಂ', aliases: ['villupuram', 'विल्लुपुरम', 'ವಿಲ್ಲುಪುರಂ'] },
  { en: 'Virudhunagar', ta: 'விருதுநகர்', hi: 'विरुधुनगर', te: 'విరుదునగర్', kn: 'ವಿರುದುನಗರ', aliases: ['sivakasi', 'சிவகாசி', 'शिवकाशी', 'శివకాశి', 'ಶಿವಕಾಶಿ'] },
]

export function districtByName(en: string | undefined): District | undefined {
  return DISTRICTS.find((d) => d.en === en)
}
