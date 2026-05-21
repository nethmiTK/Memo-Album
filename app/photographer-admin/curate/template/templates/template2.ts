export const template2 = {
  id: 'template-2',
  name: 'Editorial Split',
  description: 'Balanced split with rhythmic panel stack.',
  pages: [
    { pageNumber: 1, slots: ['leftTop', 'leftMain', 'leftBottom', 'leftInset', 'rightTop', 'rightMain', 'rightBottom'] },
    { pageNumber: 2, slots: ['leftTop', 'leftMain', 'leftBottom', 'leftCard', 'rightTop', 'rightInset', 'rightBottom'] },
    { pageNumber: 3, slots: ['leftMain', 'leftInsetA', 'leftInsetB', 'leftBottom', 'rightMain', 'rightBottomA', 'rightBottomB'] },
    { pageNumber: 4, slots: ['leftWide', 'leftTall', 'leftBottom', 'leftInset', 'rightHero', 'rightBottomMain', 'rightBottomSide'] },
    { pageNumber: 5, slots: ['leftTop', 'leftCard', 'leftBottom', 'leftInsetB', 'rightMain', 'rightFooter', 'rightCard'] },
  ],
} as const;
