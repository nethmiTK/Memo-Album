export const template5 = {
  id: 'template-5',
  name: 'Studio Narrative',
  description: 'Magazine style grid with soft card inserts.',
  pages: [
    { pageNumber: 1, slots: ['leftWide', 'leftCard', 'leftBottom', 'leftTall', 'rightHero', 'rightCard', 'rightBottom'] },
    { pageNumber: 2, slots: ['leftMain', 'leftInsetA', 'leftBottom', 'leftInsetB', 'rightMain', 'rightBottomMain', 'rightBottomSide'] },
    { pageNumber: 3, slots: ['leftHero', 'leftInset', 'leftBottom', 'leftCard', 'rightTop', 'rightFooter', 'rightBottomA'] },
    { pageNumber: 4, slots: ['leftMain', 'leftTall', 'leftBottom', 'leftInsetA', 'rightHero', 'rightBottomA', 'rightBottomB'] },
    { pageNumber: 5, slots: ['leftWide', 'leftInsetB', 'leftBottom', 'leftCard', 'rightMain', 'rightFooter', 'rightCard'] },
  ],
} as const;
