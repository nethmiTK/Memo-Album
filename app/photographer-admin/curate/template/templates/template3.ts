export const template3 = {
  id: 'template-3',
  name: 'Gallery Tall',
  description: 'Tall narrative flow with inset accents.',
  pages: [
    { pageNumber: 1, slots: ['leftMain', 'leftInset', 'leftBottom', 'leftTall', 'rightHero', 'rightInset', 'rightFooter'] },
    { pageNumber: 2, slots: ['leftMain', 'leftInsetA', 'leftBottom', 'leftCard', 'rightMain', 'rightBottomMain', 'rightBottomSide'] },
    { pageNumber: 3, slots: ['leftHero', 'leftInsetB', 'leftBottom', 'leftTall', 'rightHero', 'rightBottomA', 'rightBottomB'] },
    { pageNumber: 4, slots: ['leftWide', 'leftCard', 'leftBottom', 'leftInset', 'rightMain', 'rightBottom', 'rightCard'] },
    { pageNumber: 5, slots: ['leftTop', 'leftMain', 'leftBottom', 'leftInsetA', 'rightHero', 'rightFooter', 'rightBottomA'] },
  ],
} as const;
