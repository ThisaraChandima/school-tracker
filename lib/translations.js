// English search term → Sinhala keywords found in issues
// Used for cross-language search matching

export const EN_TO_SI = {
  // Facilities
  'laboratory':      ['විද්‍යාගාරයක්', 'විද්‍යාගාර', 'lab'],
  'lab':             ['විද්‍යාගාරයක්', 'විද්‍යාගාර'],
  'science lab':     ['විද්‍යාගාරයක්', 'විද්‍යාගාර'],
  'technology lab':  ['තාක්ෂණ', 'තාක්ෂණ විද්‍යාගාර'],
  'tech lab':        ['තාක්ෂණ', 'තාක්ෂණ විද්‍යාගාර'],
  'library':         ['පුස්තකාල', 'පුස්තකාලයක්'],
  'computer':        ['පරිගණක', 'computer'],
  'computers':       ['පරිගණක'],
  'it':              ['පරිගණක', 'තාක්ෂණ'],
  'toilet':          ['වැසිකිලි', 'කැසිකිලි'],
  'toilets':         ['වැසිකිලි', 'කැසිකිලි'],
  'sanitation':      ['වැසිකිලි', 'කැසිකිලි'],
  'water':           ['ජල', 'වතුර'],
  'electricity':     ['විදුලි'],
  'building':        ['ගොඩනැගිලි', 'ගොඩනැගිල්ල'],
  'desk':            ['ඉඳගැනීමට', 'මේස', 'බංකු'],
  'desks':           ['ඉඳගැනීමට', 'මේස', 'බංකු'],
  'furniture':       ['ඉඳගැනීමට', 'මේස'],
  'chairs':          ['ඉඳගැනීමට', 'ආසන'],
  'classroom':       ['පන්ති', 'කාමර'],
  'playground':      ['ක්‍රීඩා', 'පිටිය'],
  'sports':          ['ක්‍රීඩා'],
  'canteen':         ['කෑමට', 'ආහාර'],
  'food':            ['ආහාර', 'කෑම'],

  // Staff
  'teacher':         ['ගුරු', 'ගුරුවරු', 'ගුරුවරයෙකු'],
  'teachers':        ['ගුරු', 'ගුරුවරු'],
  'teacher shortage':['ගුරු හිඟ', 'ගුරු හිඟය'],
  'shortage':        ['හිඟ', 'හිඟය'],
  'principal':       ['විදුහල්පති'],
  'staff':           ['ගුරු', 'කාර්ය'],

  // Conditions
  'no':              ['නොමැත', 'නැත'],
  'missing':         ['නොමැත', 'හිඟ'],
  'lack':            ['නොමැත', 'හිඟ'],
  'need':            ['අවශ්‍ය', 'හිඟ'],
  'repair':          ['අලුත්වැඩියා', 'ප්‍රතිසංස්කරණ'],
  'damage':          ['හානි', 'කැඩී'],
  'broken':          ['කැඩී', 'හානි'],
  'old':             ['පැරණි', 'ජීර්ණ'],
  'insufficient':    ['හිඟ', 'ප්‍රමාණවත්'],
  'overcrowded':     ['තදබදය', 'ශිෂ්‍ය'],
  'flood':           ['ගංවතුර', 'ජල'],
  'leaking':         ['කාන්දු', 'වහළ'],
  'roof':            ['වහළ', 'ශාලා'],
  'fence':           ['වැට', 'ආරක්ෂාව'],
  'security':        ['ආරක්ෂාව', 'ආරක්ෂා'],

  // School types
  'national':        ['ජාතික', 'ම.ම.වි'],
  'primary':         ['ප්‍රාථමික', 'ප්‍රා.වි'],
  'junior':          ['කනිෂ්ඨ', 'ක.වි'],
  'muslim':          ['මුස්ලිම්', 'මු'],
  'sinhala':         ['සිංහල'],
  'tamil':           ['දෙමළ'],
}

// Build reverse flat map: for a query, get all Sinhala keywords to search
export function getSearchKeywords(query) {
  const q = query.toLowerCase().trim()
  const keywords = new Set()

  // Add original query words
  q.split(/\s+/).forEach(w => keywords.add(w))

  // Check exact phrase matches first
  Object.entries(EN_TO_SI).forEach(([en, si]) => {
    if (q.includes(en)) {
      si.forEach(s => keywords.add(s))
    }
  })

  // Check individual word matches
  q.split(/\s+/).forEach(word => {
    Object.entries(EN_TO_SI).forEach(([en, si]) => {
      if (en.includes(word) || word.includes(en)) {
        si.forEach(s => keywords.add(s))
      }
    })
  })

  return [...keywords]
}
