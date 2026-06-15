export interface JournalRecord {
  id: string;
  type: 'O\'quvchi' | 'O\'qituvchi';
  classGroup: number; // 1 to 11
  name: string; // Ism va Familiya
  examType: 'Haftalik imtihon' | 'Choraklik imtihon' | 'Oylik imtihon' | 'Yillik imtihon' | 'Kitobxonlik imtihoni';
  subject?: string; // Rus tili, Ingliz tili, Matematika, Ona tili, IT
  bookName?: string; // Qaysi kitob o'qigani (if Kitobxonlik imtihoni is selected)
  date: string; // "2026-06-15"
  result: number; // Natija (Sahifalar soni o'rnida)
  grade: number; // Baho (1-100)
}
