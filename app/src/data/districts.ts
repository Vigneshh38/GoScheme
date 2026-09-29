/** The 38 districts of Tamil Nadu, with Tamil names and common spoken aliases. */
export type District = { en: string; ta: string; aliases: string[] }

export const DISTRICTS: District[] = [
  { en: 'Ariyalur', ta: 'அரியலூர்', aliases: [] },
  { en: 'Chengalpattu', ta: 'செங்கல்பட்டு', aliases: ['chengalpet'] },
  { en: 'Chennai', ta: 'சென்னை', aliases: ['madras'] },
  { en: 'Coimbatore', ta: 'கோயம்புத்தூர்', aliases: ['kovai', 'கோவை'] },
  { en: 'Cuddalore', ta: 'கடலூர்', aliases: [] },
  { en: 'Dharmapuri', ta: 'தருமபுரி', aliases: ['தர்மபுரி'] },
  { en: 'Dindigul', ta: 'திண்டுக்கல்', aliases: [] },
  { en: 'Erode', ta: 'ஈரோடு', aliases: [] },
  { en: 'Kallakurichi', ta: 'கள்ளக்குறிச்சி', aliases: [] },
  { en: 'Kanchipuram', ta: 'காஞ்சிபுரம்', aliases: ['kanchi', 'காஞ்சி'] },
  { en: 'Kanniyakumari', ta: 'கன்னியாகுமரி', aliases: ['kanyakumari', 'nagercoil', 'நாகர்கோவில்'] },
  { en: 'Karur', ta: 'கரூர்', aliases: [] },
  { en: 'Krishnagiri', ta: 'கிருஷ்ணகிரி', aliases: [] },
  { en: 'Madurai', ta: 'மதுரை', aliases: [] },
  { en: 'Mayiladuthurai', ta: 'மயிலாடுதுறை', aliases: ['mayavaram'] },
  { en: 'Nagapattinam', ta: 'நாகப்பட்டினம்', aliases: ['nagai', 'நாகை'] },
  { en: 'Namakkal', ta: 'நாமக்கல்', aliases: [] },
  { en: 'Nilgiris', ta: 'நீலகிரி', aliases: ['ooty', 'udhagamandalam', 'ஊட்டி', 'the nilgiris'] },
  { en: 'Perambalur', ta: 'பெரம்பலூர்', aliases: [] },
  { en: 'Pudukkottai', ta: 'புதுக்கோட்டை', aliases: ['pudukottai'] },
  { en: 'Ramanathapuram', ta: 'இராமநாதபுரம்', aliases: ['ramnad', 'ராமநாதபுரம்'] },
  { en: 'Ranipet', ta: 'இராணிப்பேட்டை', aliases: ['ராணிப்பேட்டை'] },
  { en: 'Salem', ta: 'சேலம்', aliases: [] },
  { en: 'Sivaganga', ta: 'சிவகங்கை', aliases: ['sivagangai'] },
  { en: 'Tenkasi', ta: 'தென்காசி', aliases: [] },
  { en: 'Thanjavur', ta: 'தஞ்சாவூர்', aliases: ['tanjore', 'தஞ்சை'] },
  { en: 'Theni', ta: 'தேனி', aliases: [] },
  { en: 'Thoothukudi', ta: 'தூத்துக்குடி', aliases: ['tuticorin'] },
  { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி', aliases: ['trichy', 'tiruchi', 'திருச்சி'] },
  { en: 'Tirunelveli', ta: 'திருநெல்வேலி', aliases: ['nellai', 'நெல்லை'] },
  { en: 'Tirupathur', ta: 'திருப்பத்தூர்', aliases: ['tirupattur'] },
  { en: 'Tiruppur', ta: 'திருப்பூர்', aliases: ['tirupur'] },
  { en: 'Tiruvallur', ta: 'திருவள்ளூர்', aliases: ['thiruvallur'] },
  { en: 'Tiruvannamalai', ta: 'திருவண்ணாமலை', aliases: ['thiruvannamalai'] },
  { en: 'Tiruvarur', ta: 'திருவாரூர்', aliases: ['thiruvarur'] },
  { en: 'Vellore', ta: 'வேலூர்', aliases: [] },
  { en: 'Viluppuram', ta: 'விழுப்புரம்', aliases: ['villupuram'] },
  { en: 'Virudhunagar', ta: 'விருதுநகர்', aliases: [] },
]

export function districtByName(en: string | undefined): District | undefined {
  return DISTRICTS.find((d) => d.en === en)
}
